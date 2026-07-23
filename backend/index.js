require('dotenv').config();
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
const contestRouter = require('./routes/contestroute');
const initializeSocket = require("./socket/index");
const adminListRouter = require("./routes/onlineadmin");
const chatrouter = require("./routes/chatroute");
const postrouter = require("./routes/solutionpost");
const collagerouter = require("./routes/Collegeroutes")
const profileRouter = require("./routes/profileRoute");
const communityRouter = require("./routes/communityroute");

const cors = require('cors');

const app = express();
const httpServer = createServer(app);
app.get("/", (req, res) => {
    res.status(200).json({
        status: "Server is running"
    });
});
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
app.set("io", io);
app.use("/auth", authRouter);
app.use("/problem", problemRouter);
app.use("/code", submitroute);
app.use("/ai", airoute);
app.use("/video", videoRouter);
app.use("/duel", duelRouter);
app.use('/contest', contestRouter);
app.use("/api", adminListRouter);
app.use("/chat", chatrouter);
app.use("/solution", postrouter);
app.use("/collage", collagerouter)
app.use("/profile", profileRouter);
app.use("/community", communityRouter);
initializeSocket(io);

const InitlizeConnection = async () => {
  try {
    await Promise.all([client.connect(), main()]);
    console.log("DB connected");
    httpServer.listen(process.env.PORT, () => {
      console.log(`Listening at port ${process.env.PORT}`);
    });
  } catch (err) {
    console.log("Error: " + err);
  }
};

InitlizeConnection();

module.exports = { io };