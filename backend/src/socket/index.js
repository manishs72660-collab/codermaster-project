const client = require("../config/redis");
const ChatRequest = require("../models/chatrequest");
const Message = require("../models/message");

// tracks pending auto-expire timers so we can cancel them if admin responds in time
const pendingTimeouts = {}; // { chatRequestId: timeoutHandle }

function initializeSocket(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ================= STAGE 1: presence =================
    socket.on("user:online", async ({ userId, role }) => {
      try {
        socket.userId = userId;
        socket.role = role;

        await client.hSet("online_users", userId, socket.id);

        if (role === "CollageAdmin") {
          await client.sAdd("online_admins", userId);
          io.emit("admin:status_update", { userId, status: "online" });
        }
      } catch (err) {
        console.error("user:online error:", err);
      }
    });

    // ================= STAGE 2: chat request flow =================

    // USER sends a chat request to a specific online admin
    socket.on("chat:request", async ({ userId, adminId }) => {
      try {
        // FIX: block requesting a chat with yourself (e.g. a CollageAdmin
        // somehow ends up targeting their own id). Server-side guard so this
        // can't happen regardless of what the frontend sends.
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

    // ADMIN responds to a request
    socket.on("chat:respond", async ({ chatRequestId, accept }) => {
      try {
        const chatRequest = await ChatRequest.findById(chatRequestId);
        if (!chatRequest || chatRequest.status !== "pending") return;

        if (pendingTimeouts[chatRequestId]) {
          clearTimeout(pendingTimeouts[chatRequestId]);
          delete pendingTimeouts[chatRequestId];
        }

        const userSocketId = await client.hGet("online_users", chatRequest.userId.toString());

        // DIAGNOSTIC: tells us whether Redis has a stale socket id for the
        // requester (userSocketId present but not found live), or whether
        // Redis never had one to begin with (userSocketId missing). Remove
        // once you've confirmed delivery is reliable.
        const requesterSocket = userSocketId ? io.sockets.sockets.get(userSocketId) : null;
        console.log(
          "chat:respond -> requester userSocketId:",
          userSocketId,
          "| live socket found:",
          !!requesterSocket
        );

        if (accept) {
          chatRequest.status = "accepted";
          await chatRequest.save();

          const roomName = `chat-${chatRequest._id}`;
          socket.join(roomName); // admin (acceptor) joins — this is always a live socket

          // Best effort: also add the requester's socket to the room (for
          // chat:message / chat:ended delivery going forward).
          requesterSocket?.join(roomName);

          await client.set(`admin_busy:${chatRequest.adminId}`, roomName);

          const payload = { chatRequestId, roomName };

          // Room emit covers the normal case.
          io.to(roomName).emit("chat:started", payload);

          // FIX: direct emit to the requester's known socket id as a
          // fallback. If the join above silently failed (stale Redis entry,
          // multi-instance deployment without a shared adapter, etc.), the
          // room emit alone would never reach the requester and they'd be
          // stuck waiting forever. This guarantees delivery whenever Redis
          // has a currently-valid socket id for them, independent of
          // whether the room join itself succeeded.
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

    // NEW: lets a client (re)join a chat room's socket.io room on demand.
    // Needed for ChatRoomModal — when a user reopens a past chat from
    // "View All Chats" (possibly after a page refresh / new socket
    // connection), their socket was never added to that room via
    // chat:respond, so without this, live messages / chat:ended wouldn't
    // reach them even though history still loads fine via the REST call.
    socket.on("chat:join_room", async ({ roomName }) => {
      try {
        socket.join(roomName);
      } catch (err) {
        console.error("chat:join_room error:", err);
      }
    });

    // persists to MongoDB so refresh doesn't lose history
    socket.on("chat:message", async ({ roomName, chatRequestId, senderId, text }) => {
      try {
        if (!text || !text.trim()) return; // ignore empty messages

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

    // either side ends the chat
    socket.on("chat:end", async ({ chatRequestId, roomName, adminId }) => {
      try {
        await ChatRequest.findByIdAndUpdate(chatRequestId, { status: "ended" });
        await client.del(`admin_busy:${adminId}`);
        io.to(roomName).emit("chat:ended");
      } catch (err) {
        console.error("chat:end error:", err);
      }
    });

    // ================= existing duel/contest handlers (unchanged) =================

    socket.on("duel:join_room", ({ roomCode, userId }) => {
      socket.join(roomCode);
      socket.to(roomCode).emit("duel:opponent_joined", { userId });
    });

    socket.on("duel:ready", ({ roomCode, userId }) => {
      socket.to(roomCode).emit("duel:opponent_ready", { userId });
    });

    socket.on("duel:progress", ({ roomCode, userId, testCasesPassed, total }) => {
      socket.to(roomCode).emit("duel:opponent_progress", { userId, testCasesPassed, total });
    });

    socket.on("contest:join", ({ contestId, userId }) => {
      socket.join(`contest-${contestId}`);
    });

    socket.on("contest:leave", ({ contestId }) => {
      socket.leave(`contest-${contestId}`);
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((room) => {
        socket.to(room).emit("duel:opponent_left");
      });
    });

    // ================= disconnect cleanup =================
    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id);
      try {
        if (socket.userId) {
          await client.hDel("online_users", socket.userId);

          if (socket.role === "CollageAdmin") {
            await client.sRem("online_admins", socket.userId);
            io.emit("admin:status_update", { userId: socket.userId, status: "offline" });

            // release admin_busy if they disconnect mid-chat
            await client.del(`admin_busy:${socket.userId}`);
          }
        }
      } catch (err) {
        console.error("disconnect cleanup error:", err);
      }
    });
  });
}

module.exports = initializeSocket;