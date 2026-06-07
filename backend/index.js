require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const { createServer } = require("http");           // ✅ NEW
const { Server } = require("socket.io");            // ✅ NEW
const main = require("./config/db");
const User = require("./models/Userschema");
const authRouter = require("./routes/auth");
const cookieparser = require("cookie-parser");
const rateLimiter = require("./middleware/ratelimitor");
const client = require("./config/redis");
const problemRouter = require("./routes/problemCreator");
const submitroute = require("./routes/submitroute");
const airoute = require("./routes/aichat");
const videoRouter = require("./routes/videocreator");
const duelRouter = require("./routes/duelroute");   // ✅ NEW
require('dotenv').config();
const cors = require('cors');

const app = express();
const httpServer = createServer(app);               // ✅ NEW — wrap express in http server

// ✅ NEW — Socket.io attached to http server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieparser());
app.use(rateLimiter);

// ✅ Make io accessible in routes/controllers
app.set("io", io);

app.use("/auth", authRouter);
app.use("/problem", problemRouter);
app.use("/code", submitroute);
app.use("/ai", airoute);
app.use("/video", videoRouter);
app.use("/duel", duelRouter);                       // ✅ NEW

// ✅ Socket.io connection handler
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join a duel room
  socket.on("duel:join_room", ({ roomCode, userId }) => {
    socket.join(roomCode);
    socket.to(roomCode).emit("duel:opponent_joined", { userId });
    console.log(`User ${userId} joined room ${roomCode}`);
  });

  // Player is ready
  socket.on("duel:ready", ({ roomCode, userId }) => {
    socket.to(roomCode).emit("duel:opponent_ready", { userId });
  });

  // Broadcast progress to opponent
  socket.on("duel:progress", ({ roomCode, userId, testCasesPassed, total }) => {
    socket.to(roomCode).emit("duel:opponent_progress", {
      userId,
      testCasesPassed,
      total
    });
  });

  // Handle disconnect
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach(room => {
      socket.to(room).emit("duel:opponent_left");
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const InitlizeConnection = async () => {
  try {
    await Promise.all([client.connect(), main()]);
    console.log("DB connected");

    // ✅ use httpServer instead of app.listen
    httpServer.listen(process.env.PORT, () => {
      console.log(`Listening at port ${process.env.PORT}`);
    });
  } catch (err) {
    console.log("Error: " + err);
  }
};

InitlizeConnection();

module.exports = { io };   // ✅ export so controllers can use it