const client = require("../config/redis");
const ChatRequest = require("../models/ChatRequest");
const Message = require("../models/Message");

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

        // FIX: the people users request chats WITH are "CollageAdmin" accounts,
        // not the platform-level "Admin". Was checking "Admin" here, so college
        // admins never registered as online and never appeared in the admin list.
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

        if (accept) {
          chatRequest.status = "accepted";
          await chatRequest.save();

          const roomName = `chat-${chatRequest._id}`;
          socket.join(roomName); // admin joins
          if (userSocketId) {
            io.sockets.sockets.get(userSocketId)?.join(roomName); // user joins
          }

          await client.set(`admin_busy:${chatRequest.adminId}`, roomName);

          io.to(roomName).emit("chat:started", { chatRequestId, roomName });
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
      await ChatRequest.findByIdAndUpdate(chatRequestId, { status: "ended" });
      await client.del(`admin_busy:${adminId}`);
      io.to(roomName).emit("chat:ended");
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

          // FIX: was checking "admin" (lowercase) — didn't match "CollageAdmin"
          // OR the "Admin" check used above, so cleanup never actually ran.
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