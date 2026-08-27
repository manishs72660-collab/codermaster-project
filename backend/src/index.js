require("dotenv").config();

require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

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
const duelRouter = require("./routes/duelroute");
const contestRouter = require("./routes/Contestroute");

const initializeSocket = require("./socket/index");

const adminListRouter = require("./routes/onlineadmin");
const chatrouter = require("./routes/chatroute");
const postrouter = require("./routes/solutionpost");
const collagerouter = require("./routes/Collegeroutes");
const profileRouter = require("./routes/profileRoute");
const communityRouter = require("./routes/Communityroute");
const discussionRouter = require("./routes/Discussionrouter");
const mcqrouter = require("./routes/Mcqcontest");

const cors = require("cors");

const app = express();
const httpServer = createServer(app);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "Server is running",
  });
});

/* =========================================================
   CORS
   Supports:
   1. Local frontend
   2. Production Vercel frontend
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://codemaster-frontend-ruddy.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without Origin
    // Example: Postman / server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

console.log("Allowed CORS origins:");
console.log(allowedOrigins);

/* =========================================================
   SOCKET.IO
========================================================= */

const io = new Server(httpServer, {
  cors: corsOptions,
});

/* =========================================================
   EXPRESS MIDDLEWARE
========================================================= */

app.use(cors(corsOptions));

app.use(express.json());

app.use(cookieparser());

// app.use(rateLimiter);

app.set("io", io);

/* =========================================================
   SOCKET DEBUG
   Remove later if you don't need it.
========================================================= */

io.on("connection", (socket) => {
  console.log("=================================");
  console.log("✅ SOCKET CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("Origin:", socket.handshake.headers.origin);
  console.log("Cookie:", socket.handshake.headers.cookie);
  console.log("=================================");

  socket.on("disconnect", (reason) => {
    console.log("🔴 SOCKET DISCONNECTED:", socket.id, reason);
  });
});

/* =========================================================
   ROUTES
========================================================= */

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

/* =========================================================
   INITIALIZE SOCKET EVENTS
========================================================= */

initializeSocket(io);

/* =========================================================
   DATABASE + REDIS + SERVER
========================================================= */

const InitlizeConnection = async () => {
  try {
    await Promise.all([
      client.connect(),
      main(),
    ]);

    console.log("✅ DB connected");
    console.log("✅ Redis connected");

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