const express = require('express');
const router = express.Router();
const userAuth=require("../middleware/userauth");
const {
  createDuel,
  joinDuel,
  submitDuelCode,
  getDuelRoom,
  getDuelStats,
  getDuelLeaderboard,
  rematchDuel,
  getDuelReplay
} = require('../controller/duelController');

router.post('/create', userAuth, createDuel);
router.get('/join/:roomCode', userAuth, joinDuel);
router.post('/submit/:roomId', userAuth, submitDuelCode);
router.get('/room/:roomCode', userAuth, getDuelRoom);
router.get('/stats', userAuth, getDuelStats);
router.get('/leaderboard', getDuelLeaderboard);
router.post("/rematch/:roomId", userAuth, rematchDuel);
router.get("/replay/:roomId", userAuth, getDuelReplay);

module.exports = router;