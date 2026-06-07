const DuelRoom = require("../models/DuelRoom");
const DuelStats = require("../models/DuelStats");
const Problem = require("../models/problemschema");
const { getLanguageById, submitBatch, submitToken } = require("../utils/probelmutlity");
const { buildFullCode } = require("../controller/userproblem");
const { calculateElo } = require("../utils/eloCalculator");

// ─── Generate random 6-char room code ────────────────────────────────────────
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ─── GET or CREATE duel stats for a user ─────────────────────────────────────
const getOrCreateStats = async (userId) => {
  let stats = await DuelStats.findOne({ userId });
  if (!stats) stats = await DuelStats.create({ userId });
  return stats;
};

// ─── CREATE DUEL ROOM ─────────────────────────────────────────────────────────
const createDuel = async (req, res) => {
  try {
    const userId = req.result._id;
    const { problemId, timeLimit } = req.body;

    if (!problemId) return res.status(400).json({ message: "problemId is required" });

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // Generate unique room code
    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await DuelRoom.findOne({ roomCode });
    }

    const duelRoom = await DuelRoom.create({
      roomCode,
      problemId,
      timeLimit: timeLimit || 30,
      player1: { userId }
    });

    res.status(201).json({
      roomCode: duelRoom.roomCode,
      roomId: duelRoom._id,
      problem: {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty
      },
      timeLimit: duelRoom.timeLimit,
      message: "Room created! Share the room code with your opponent."
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── JOIN DUEL ROOM ───────────────────────────────────────────────────────────
const joinDuel = async (req, res) => {
  try {
    const userId = req.result._id;
    const { roomCode } = req.params;

    const duelRoom = await DuelRoom.findOne({ roomCode })
      .populate('problemId', 'title difficulty description visibleTestCases startCode tags driverCode hiddenTestCases'); // ✅ added driverCode + hiddenTestCases

    if (!duelRoom) return res.status(404).json({ message: "Room not found" });
    if (duelRoom.status === 'finished') return res.status(400).json({ message: "Duel already finished" });

    // Check if user is already player1
    const isPlayer1 = duelRoom.player1.userId.toString() === userId.toString();
    if (isPlayer1) {
      // ✅ removed 'active' block — allow player1 to rejoin active room
      return res.status(200).json({
        roomId: duelRoom._id,
        roomCode: duelRoom.roomCode,
        problem: duelRoom.problemId,
        timeLimit: duelRoom.timeLimit,
        role: 'player1',
        status: duelRoom.status
      });
    }

    // Check if user is already player2 rejoining
    if (duelRoom.player2?.userId?.toString() === userId.toString()) {
      return res.status(200).json({
        roomId: duelRoom._id,
        roomCode: duelRoom.roomCode,
        problem: duelRoom.problemId,
        timeLimit: duelRoom.timeLimit,
        role: 'player2',
        status: duelRoom.status
      });
    }

    // ✅ New player2 joining
    if (duelRoom.player2) return res.status(400).json({ message: "Room is full" });
    if (duelRoom.status === 'active') return res.status(400).json({ message: "Duel already started" });

    duelRoom.player2 = { userId };
    duelRoom.status = 'active';
    duelRoom.startedAt = new Date();
    await duelRoom.save();

    const io = req.app.get("io");

    // ✅ emit opponent_joined first
    io.to(roomCode).emit("duel:opponent_joined", { userId });

    // ✅ emit duel:start after 500ms so Player1 socket is ready
    setTimeout(() => {
      io.to(roomCode).emit("duel:start", {
        message: "Both players connected! Duel starting...",
        startedAt: duelRoom.startedAt,
        timeLimit: duelRoom.timeLimit
      });
    }, 500);

    res.status(200).json({
      roomId: duelRoom._id,
      roomCode: duelRoom.roomCode,
      problem: duelRoom.problemId,
      timeLimit: duelRoom.timeLimit,
      role: 'player2',
      status: duelRoom.status
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
// ─── SUBMIT CODE IN DUEL ──────────────────────────────────────────────────────
const submitDuelCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const { roomId } = req.params;
    const { code, language: rawLanguage } = req.body;

    const language = rawLanguage === "cpp" ? "c++" : rawLanguage;

    const duelRoom = await DuelRoom.findById(roomId).populate('problemId');
    if (!duelRoom) return res.status(404).json({ message: "Duel room not found" });
    if (duelRoom.status === 'finished') return res.status(400).json({ message: "Duel already finished" });

    const problem = duelRoom.problemId;

    // Get driver code and wrap
    const driverEntry = problem.driverCode?.find(
      (d) => d.language.toLowerCase() === language.toLowerCase()
    );
    if (!driverEntry) return res.status(400).json({ message: `No driver code for: ${language}` });

    const fullCode = buildFullCode(code, driverEntry.code, language);
    const languageId = getLanguageById(language);

    // Submit to Judge0
    const submissions = problem.hiddenTestCases.map((tc) => ({
      source_code: fullCode,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output.trim()
    }));

    const submitResult = await submitBatch(submissions);
    const tokens = submitResult.map((v) => v.token);
    const testResult = await submitToken(tokens);

    // Count results
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time || 0);
        memory = Math.max(memory, test.memory || 0);
      }
    }

    const totalTestCases = problem.hiddenTestCases.length;
    const allPassed = testCasesPassed === totalTestCases;

    // Determine which player
    const isPlayer1 = duelRoom.player1.userId.toString() === userId.toString();
    const playerKey = isPlayer1 ? 'player1' : 'player2';

    // Update player data
    duelRoom[playerKey].testCasesPassed = testCasesPassed;
    duelRoom[playerKey].totalTestCases = totalTestCases;
    duelRoom[playerKey].runtime = runtime;
    duelRoom[playerKey].memory = memory;
    duelRoom[playerKey].code = code;
    duelRoom[playerKey].language = language;
    duelRoom[playerKey].submittedAt = new Date();

    const io = req.app.get("io");

    // Broadcast progress to opponent
    io.to(duelRoom.roomCode).emit("duel:progress", {
      userId,
      testCasesPassed,
      total: totalTestCases,
      allPassed
    });

    if (allPassed && duelRoom.status !== 'finished') {
      // This player WON
      duelRoom.status = 'finished';
      duelRoom.winnerId = userId;
      duelRoom.finishedAt = new Date();
      duelRoom[playerKey].status = 'won';

      // Mark loser
      const loserKey = isPlayer1 ? 'player2' : 'player1';
      if (duelRoom[loserKey]) duelRoom[loserKey].status = 'lost';

      await duelRoom.save();

      // Update ELO ratings
      const loserId = duelRoom[loserKey]?.userId;
      if (loserId) {
        const [winnerStats, loserStats] = await Promise.all([
          getOrCreateStats(userId),
          getOrCreateStats(loserId)
        ]);

        const { newWinnerRating, newLoserRating, winnerGain, loserLoss } =
          calculateElo(winnerStats.rating, loserStats.rating);

        // Update winner
        winnerStats.rating = newWinnerRating;
        winnerStats.bestRating = Math.max(winnerStats.bestRating, newWinnerRating);
        winnerStats.wins += 1;
        winnerStats.totalDuels += 1;
        winnerStats.winStreak += 1;
        await winnerStats.save();

        // Update loser
        loserStats.rating = Math.max(0, newLoserRating);
        loserStats.losses += 1;
        loserStats.totalDuels += 1;
        loserStats.winStreak = 0;
        await loserStats.save();

        // Broadcast winner to room
        io.to(duelRoom.roomCode).emit("duel:finished", {
          winnerId: userId,
          winnerGain,
          loserLoss,
          runtime,
          memory,
          testCasesPassed,
          totalTestCases
        });

        return res.status(200).json({
          accepted: true,
          won: true,
          testCasesPassed,
          totalTestCases,
          runtime,
          memory,
          ratingChange: `+${winnerGain}`,
          newRating: newWinnerRating
        });
      }
    }

    await duelRoom.save();

    res.status(200).json({
      accepted: allPassed,
      won: false,
      testCasesPassed,
      totalTestCases,
      runtime,
      memory
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── GET DUEL ROOM INFO ───────────────────────────────────────────────────────
const getDuelRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    console.log("getDuelRoom called with roomCode:", roomCode); // ✅ add
    
    const duelRoom = await DuelRoom.findOne({ roomCode })
      .populate('problemId', 'title difficulty description visibleTestCases startCode tags driverCode hiddenTestCases')
      .populate('player1.userId', 'firstName')
      .populate('player2.userId', 'firstName')
      .populate('winnerId', 'firstName');

    console.log("duelRoom found:", duelRoom?._id); // ✅ add
    console.log("problemId:", duelRoom?.problemId); // ✅ add

    if (!duelRoom) return res.status(404).json({ message: "Room not found" });

    res.status(200).json(duelRoom);
  } catch (err) {
    console.error("getDuelRoom error:", err); // ✅ add
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── GET DUEL STATS ───────────────────────────────────────────────────────────
const getDuelStats = async (req, res) => {
  try {
    const userId = req.result._id;
    const stats = await getOrCreateStats(userId);

    // Get recent duels
    const recentDuels = await DuelRoom.find({
      $or: [{ 'player1.userId': userId }, { 'player2.userId': userId }],
      status: 'finished'
    })
      .sort({ finishedAt: -1 })
      .limit(10)
      .populate('problemId', 'title difficulty')
      .populate('winnerId', 'firstName');

    res.status(200).json({
      rating: stats.rating,
      bestRating: stats.bestRating,
      wins: stats.wins,
      losses: stats.losses,
      totalDuels: stats.totalDuels,
      winStreak: stats.winStreak,
      winRate: stats.totalDuels > 0
        ? Math.round((stats.wins / stats.totalDuels) * 100)
        : 0,
      recentDuels
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── GET LEADERBOARD ──────────────────────────────────────────────────────────
const getDuelLeaderboard = async (req, res) => {
  try {
    const leaderboard = await DuelStats.find()
      .sort({ rating: -1 })
      .limit(20)
      .populate('userId', 'firstName emailId');

    res.status(200).json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

module.exports = {
  createDuel,
  joinDuel,
  submitDuelCode,
  getDuelRoom,
  getDuelStats,
  getDuelLeaderboard
};