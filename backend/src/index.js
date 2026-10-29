require("dotenv").config();

require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const main = require("./config/db");
const authRouter = require("./routes/auth");
const cookieparser = require("cookie-parser");
const rateLimiter = require("./middleware/ratelimitor");
const client = require("./config/redis");

// 🔥 STEP 4: Socket.io Redis Adapter import
const { createAdapter } = require("@socket.io/redis-adapter");

const problemRouter = require("./routes/problemCreator");
const submitroute = require("./routes/submitroute");
const airoute = require("./routes/aichat");
const videoRouter = require("./routes/videocreator");
const duelRouter = require("./routes/duelroute");
const contestRouter = require("./routes/Contestroute");

const initializeSocket = require("./socket/index");

// STEP 3: Background Worker import (Taaki queue process ho sake)
require("./workers/submissionWorker");

const adminListRouter = require("./routes/onlineadmin");
const chatrouter = require("./routes/chatroute");
const postrouter = require("./routes/solutionpost");
const collagerouter = require("./routes/Collegeroutes");
const profileRouter = require("./routes/profileRoute");
const communityRouter = require("./routes/Communityroute");
const discussionRouter = require("./routes/Discussionrouter");
const mcqrouter = require("./routes/Mcqcontest");
const designProblemRoutes = require("./routes/designProblemRoutes");
const designSubmissionRoutes = require("./routes/designSubmissionRoutes");
const compilerRouter = require("./routes/Compilerroutes");
const cors = require("cors");

const app = express();
const httpServer = createServer(app);

// =========================================================
// HEALTH CHECK
// =========================================================
app.get("/", (req, res) => {
  res.status(200).json({ status: "Server is running" });
});

// =========================================================
// CORS
// =========================================================
const allowedOrigins = [
  "http://localhost:5173",
  "https://codemaster-frontend-ruddy.vercel.app",
  "https://codermaster-project.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log("❌ CORS blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// =========================================================
// SOCKET.IO SETUP + REDIS ADAPTER
// =========================================================
const io = new Server(httpServer, { cors: corsOptions });

// 🔥 STEP 4: Redis Adapter Setup
const pubClient = client.duplicate();
const subClient = client.duplicate();

// Error handling (taaki server crash na ho agar Redis down ho)
pubClient.on("error", (err) => console.error("Redis PubClient Error:", err));
subClient.on("error", (err) => console.error("Redis SubClient Error:", err));

// Dono clients ko connect karo, phir Socket.io me Adapter lagao
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("✅ Socket.io Redis Adapter Connected & Ready");
}).catch((err) => {
  console.error("❌ Failed to connect Redis Adapter:", err);
});

// Worker ko globally io instance chahiye result emit karne ke liye
global.io = io; 

// =========================================================
// EXPRESS MIDDLEWARE
// =========================================================
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieparser());
// app.use(rateLimiter); // (Tera rate limiter)
app.set("io", io);

// =========================================================
// SOCKET DEBUG & JOIN ROOM
// =========================================================
io.on("connection", (socket) => {
  console.log("=================================");
  console.log("✅ SOCKET CONNECTED:", socket.id);
  console.log("=================================");

  // 🔥 Frontend jab connect hoga, tab apna userId bhejega.
  // Hum usko uske userId wale room me daal denge. 
  // Agar user multiple tabs kholta hai, toh sab isi room me honge.
  socket.on("join_user_room", ({ userId }) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined room: user-${userId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 SOCKET DISCONNECTED:", socket.id, reason);
  });
});

// =========================================================
// ROUTES
// =========================================================
app.use("/auth", rateLimiter, authRouter);
app.use("/problem", problemRouter);
app.use("/code", submitroute);
app.use("/ai", airoute);
app.use("/video", videoRouter);
app.use("/duel", duelRouter);
app.use("/contest", contestRouter);
app.use("/api", adminListRouter);
app.use("/chat", chatrouter);
app.use("/solution", postrouter);
app.use("/collage", collagerouter);
app.use("/profile", profileRouter);
app.use("/community", communityRouter);
app.use("/discuss", discussionRouter);
app.use("/mcq-contest", mcqrouter);
app.use("/design", designSubmissionRoutes);
app.use("/designprolem", designProblemRoutes);
app.use("/compiler", compilerRouter);

// =========================================================
// INITIALIZE SOCKET EVENTS (Tera purana socket logic)
// =========================================================
initializeSocket(io);

// =========================================================
// DATABASE + REDIS + SERVER
// =========================================================
const InitlizeConnection = async () => {
  try {
    await Promise.all([
      client.connect(),
      main(),
    ]);

    console.log("✅ DB connected");
    console.log("✅ Main Redis connected");
    console.log("✅ BullMQ Worker Started & Listening");

    const PORT = process.env.PORT || 3000;

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server initialization error:", err);
  }
};

InitlizeConnection();

module.exports = { io };