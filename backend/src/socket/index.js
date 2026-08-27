const client = require("../config/redis");
const ChatRequest = require("../models/chatrequest");
const Message = require("../models/message");

const pendingTimeouts = {}; // { chatRequestId: timeoutHandle }
const spectatorRooms = {};  // { roomCode: Set of spectator socket ids }

// Shared cleanup used by both the explicit "user:offline" event (logout
// while the tab stays open) and the "disconnect" event (tab closed /
// connection dropped). Keeping this in one place avoids the two paths
// drifting apart.
async function clearPresence(io, socket, userId, role) {
  try {
    await client.hDel("online_users", userId);

    if (role === "CollageAdmin" || role === "Admin") {
      await client.sRem("online_admins", userId);
      io.emit("admin:status_update", { userId, status: "offline" });
      await client.del(`admin_busy:${userId}`);
    }
  } catch (err) {
    console.error("clearPresence error:", err);
  }
}

function initializeSocket(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ================= STAGE 1: presence =================
    socket.on("user:online", async ({ userId, role }) => {
      try {
        socket.userId = userId;
        socket.role = role;

        await client.hSet("online_users", userId, socket.id);

        if (role === "CollageAdmin" || role === "Admin") {
          await client.sAdd("online_admins", userId);
          io.emit("admin:status_update", { userId, status: "online" });
        }
      } catch (err) {
        console.error("user:online error:", err);
      }
    });

    // Explicit logout while the socket connection is still open (user
    // logged out but didn't close the tab). Mirrors the disconnect
    // cleanup below, but does NOT disconnect the socket itself - the
    // tab may log in as someone else next.
    socket.on("user:offline", async ({ userId }) => {
      try {
        const role = socket.role; // set during user:online
        await clearPresence(io, socket, userId, role);

        socket.userId = null;
        socket.role = null;
      } catch (err) {
        console.error("user:offline error:", err);
      }
    });

    // ================= STAGE 2: chat request flow (unchanged) =================

    socket.on("chat:request", async ({ userId, adminId }) => {
      try {
        if (userId === adminId) {
          socket.emit("chat:request_failed", { reason: "You can't request a chat with yourself" });
          return;
        }

        const adminSocketId = await client.hGet("online_users", adminId);
        if (!adminSocketId) {
          socket.emit("chat:request_failed", { reason: "Admin is no longer online" });
          return;
        }

        const adminBusy = await client.get(`admin_busy:${adminId}`);
        if (adminBusy) {
          socket.emit("chat:request_failed", { reason: "Admin is currently in another chat" });
          return;
        }

        const chatRequest = await ChatRequest.create({ userId, adminId, status: "pending" });

        io.to(adminSocketId).emit("chat:incoming_request", {
          chatRequestId: chatRequest._id,
          userId,
        });

        socket.emit("chat:request_sent", { chatRequestId: chatRequest._id });

        pendingTimeouts[chatRequest._id] = setTimeout(async () => {
          const fresh = await ChatRequest.findById(chatRequest._id);
          if (fresh && fresh.status === "pending") {
            fresh.status = "expired";
            await fresh.save();
            socket.emit("chat:request_expired", { chatRequestId: chatRequest._id });
            io.to(adminSocketId).emit("chat:request_expired", { chatRequestId: chatRequest._id });
          }
          delete pendingTimeouts[chatRequest._id];
        }, 45000);

      } catch (err) {
        console.error("chat:request error:", err);
        socket.emit("chat:request_failed", { reason: "Server error" });
      }
    });

    socket.on("chat:respond", async ({ chatRequestId, accept }) => {
      try {
        const chatRequest = await ChatRequest.findById(chatRequestId);
        if (!chatRequest || chatRequest.status !== "pending") return;

        if (pendingTimeouts[chatRequestId]) {
          clearTimeout(pendingTimeouts[chatRequestId]);
          delete pendingTimeouts[chatRequestId];
        }

        const userSocketId = await client.hGet("online_users", chatRequest.userId.toString());
        const requesterSocket = userSocketId ? io.sockets.sockets.get(userSocketId) : null;

        if (accept) {
          chatRequest.status = "accepted";
          await chatRequest.save();

          const roomName = `chat-${chatRequest._id}`;
          socket.join(roomName);
          requesterSocket?.join(roomName);

          await client.set(`admin_busy:${chatRequest.adminId}`, roomName);

          const payload = { chatRequestId, roomName };

          io.to(roomName).emit("chat:started", payload);

          if (userSocketId) {
            io.to(userSocketId).emit("chat:started", payload);
          }
        } else {
          chatRequest.status = "declined";
          await chatRequest.save();
          if (userSocketId) {
            io.to(userSocketId).emit("chat:request_declined", { chatRequestId });
          }
        }
      } catch (err) {
        console.error("chat:respond error:", err);
      }
    });

    socket.on("chat:join_room", async ({ roomName }) => {
      try {
        socket.join(roomName);
      } catch (err) {
        console.error("chat:join_room error:", err);
      }
    });

    socket.on("chat:message", async ({ roomName, chatRequestId, senderId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const message = await Message.create({ chatRequestId, senderId, text: text.trim() });

        io.to(roomName).emit("chat:message", {
          _id: message._id,
          senderId,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error("chat:message error:", err);
      }
    });

    socket.on("chat:end", async ({ chatRequestId, roomName, adminId }) => {
      try {
        await ChatRequest.findByIdAndUpdate(chatRequestId, { status: "ended" });
        await client.del(`admin_busy:${adminId}`);
        io.to(roomName).emit("chat:ended");
      } catch (err) {
        console.error("chat:end error:", err);
      }
    });

    // ================= DUEL: core (unchanged) =================

    socket.on("duel:join_room", ({ roomCode, userId }) => {
      socket.join(roomCode);
      socket.to(roomCode).emit("duel:opponent_joined", { userId });
    });

    socket.on("duel:ready", ({ roomCode, userId }) => {
      socket.to(roomCode).emit("duel:opponent_ready", { userId });
    });

    socket.on("duel:progress", ({ roomCode, userId, testCasesPassed, total }) => {
      socket.to(roomCode).emit("duel:opponent_progress", {
        userId,
        testCasesPassed,
        total,
        percent: total ? Math.round((testCasesPassed / total) * 100) : 0
      });
    });

    // DUEL CHAT — live-only, no persistence, scoped to roomCode (players + spectators)
    socket.on("duel:chat_message", ({ roomCode, userId, name, text }) => {
      if (!text || !text.trim()) return;
      io.to(roomCode).emit("duel:chat_message", {
        userId,
        name: name || "Player",
        text: text.trim(),
        createdAt: new Date()
      });
    });

    // LIVE CODE STREAM — a player's editor changes are relayed ONLY to
    // the spec-{roomCode} room (spectators), never to the opponent's socket.
    // This keeps the actual duel fair (no one can see their opponent's code
    // live) while still letting spectators watch both editors update in
    // real time. Frontend should debounce/throttle this call (e.g. every
    // 300-500ms) rather than emitting on every keystroke.
    socket.on("duel:code_update", ({ roomCode, userId, code, language }) => {
      io.to(`spec-${roomCode}`).emit("duel:opponent_code_update", { userId, code, language });
    });

    // SPECTATOR MODE — any logged-in user can watch a room live.
    // Spectators join BOTH the main roomCode room (for progress/chat/finish
    // events) and a dedicated spec-{roomCode} room (for the live code feed),
    // so code updates never leak into the roomCode broadcast the players share.
    socket.on("duel:spectate_join", ({ roomCode, userId }) => {
      try {
        socket.join(roomCode);
        socket.join(`spec-${roomCode}`);
        socket.isSpectator = true;
        socket.spectatingRoom = roomCode;

        if (!spectatorRooms[roomCode]) spectatorRooms[roomCode] = new Set();
        spectatorRooms[roomCode].add(socket.id);

        socket.to(roomCode).emit("duel:spectator_joined", { userId });
        io.to(roomCode).emit("duel:spectator_count", { count: spectatorRooms[roomCode].size });
      } catch (err) {
        console.error("duel:spectate_join error:", err);
      }
    });

    socket.on("duel:spectate_leave", ({ roomCode, userId }) => {
      try {
        socket.leave(roomCode);
        socket.leave(`spec-${roomCode}`);
        if (spectatorRooms[roomCode]) {
          spectatorRooms[roomCode].delete(socket.id);
          io.to(roomCode).emit("duel:spectator_count", { count: spectatorRooms[roomCode].size });
        }
        socket.isSpectator = false;
        socket.spectatingRoom = null;
      } catch (err) {
        console.error("duel:spectate_leave error:", err);
      }
    });

    // ================= CONTEST (unchanged) =================

    socket.on("contest:join", ({ contestId, userId }) => {
      socket.join(`contest-${contestId}`);
    });

    socket.on("contest:leave", ({ contestId }) => {
      socket.leave(`contest-${contestId}`);
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((room) => {
        if (!(socket.isSpectator && (socket.spectatingRoom === room || room === `spec-${socket.spectatingRoom}`))) {
          socket.to(room).emit("duel:opponent_left");
        }
      });
    });

    // ================= disconnect cleanup =================
    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id);
      try {
        if (socket.isSpectator && socket.spectatingRoom && spectatorRooms[socket.spectatingRoom]) {
          spectatorRooms[socket.spectatingRoom].delete(socket.id);
          io.to(socket.spectatingRoom).emit("duel:spectator_count", {
            count: spectatorRooms[socket.spectatingRoom].size
          });
        }

        if (socket.userId) {
          await clearPresence(io, socket, socket.userId, socket.role);
        }
      } catch (err) {
        console.error("disconnect cleanup error:", err);
      }
    });
  });
}

module.exports = initializeSocket;