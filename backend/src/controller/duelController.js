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
      .populate('problemId', 'title difficulty description visibleTestCases startCode tags driverCode hiddenTestCases');

    if (!duelRoom) return res.status(404).json({ message: "Room not found" });
    if (duelRoom.status === 'finished') return res.status(400).json({ message: "Duel already finished" });

    const isPlayer1 = duelRoom.player1.userId.toString() === userId.toString();
    if (isPlayer1) {
      return res.status(200).json({
        roomId: duelRoom._id,
        roomCode: duelRoom.roomCode,
        problem: duelRoom.problemId,
        timeLimit: duelRoom.timeLimit,
        role: 'player1',
        status: duelRoom.status
      });
    }

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

    if (duelRoom.player2) return res.status(400).json({ message: "Room is full" });
    if (duelRoom.status === 'active') return res.status(400).json({ message: "Duel already started" });

    duelRoom.player2 = { userId };
    duelRoom.status = 'active';
    duelRoom.startedAt = new Date();
    await duelRoom.save();

    const io = req.app.get("io");

    io.to(roomCode).emit("duel:opponent_joined", { userId });

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

    const driverEntry = problem.driverCode?.find(
      (d) => d.language.toLowerCase() === language.toLowerCase()
    );
    if (!driverEntry) return res.status(400).json({ message: `No driver code for: ${language}` });

    const fullCode = buildFullCode(code, driverEntry.code, language);
    const languageId = getLanguageById(language);

    const submissions = problem.hiddenTestCases.map((tc) => ({
      source_code: fullCode,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output.trim()
    }));

    const submitResult = await submitBatch(submissions);
    const tokens = submitResult.map((v) => v.token);
    const testResult = await submitToken(tokens);

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

    const isPlayer1 = duelRoom.player1.userId.toString() === userId.toString();
    const playerKey = isPlayer1 ? 'player1' : 'player2';

    duelRoom[playerKey].testCasesPassed = testCasesPassed;
    duelRoom[playerKey].totalTestCases = totalTestCases;
    duelRoom[playerKey].runtime = runtime;
    duelRoom[playerKey].memory = memory;
    duelRoom[playerKey].code = code;
    duelRoom[playerKey].language = language;
    duelRoom[playerKey].submittedAt = new Date();

    const io = req.app.get("io");

    // Live progress broadcast — frontend renders opponent's progress bar from this
    io.to(duelRoom.roomCode).emit("duel:progress", {
      userId,
      testCasesPassed,
      total: totalTestCases,
      percent: Math.round((testCasesPassed / totalTestCases) * 100), // ✅ NEW: convenience field for progress bar UI
      allPassed
    });

    if (allPassed && duelRoom.status !== 'finished') {
      duelRoom.status = 'finished';
      duelRoom.winnerId = userId;
      duelRoom.finishedAt = new Date();
      duelRoom[playerKey].status = 'won';

      const loserKey = isPlayer1 ? 'player2' : 'player1';
      if (duelRoom[loserKey]) duelRoom[loserKey].status = 'lost';

      await duelRoom.save();

      const loserId = duelRoom[loserKey]?.userId;
      if (loserId) {
        const [winnerStats, loserStats] = await Promise.all([
          getOrCreateStats(userId),
          getOrCreateStats(loserId)
        ]);

        // ✅ CHANGED: pass problem.difficulty for weighted ELO
        const { newWinnerRating, newLoserRating, winnerGain, loserLoss, kFactorUsed } =
          calculateElo(winnerStats.rating, loserStats.rating, problem.difficulty);

        winnerStats.rating = newWinnerRating;
        winnerStats.bestRating = Math.max(winnerStats.bestRating, newWinnerRating);
        winnerStats.wins += 1;
        winnerStats.totalDuels += 1;
        winnerStats.winStreak += 1;
        await winnerStats.save();

        loserStats.rating = Math.max(0, newLoserRating);
        loserStats.losses += 1;
        loserStats.totalDuels += 1;
        loserStats.winStreak = 0;
        await loserStats.save();

        io.to(duelRoom.roomCode).emit("duel:finished", {
          winnerId: userId,
          winnerGain,
          loserLoss,
          runtime,
          memory,
          testCasesPassed,
          totalTestCases,
          difficulty: problem.difficulty, // ✅ NEW
          kFactorUsed // ✅ NEW
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

// ✅ NEW: REMATCH — same players, new random problem at same difficulty
const rematchDuel = async (req, res) => {
  try {
    const userId = req.result._id;
    const { roomId } = req.params;

    const oldRoom = await DuelRoom.findById(roomId).populate('problemId');
    if (!oldRoom) return res.status(404).json({ message: "Original duel room not found" });
    if (oldRoom.status !== 'finished') return res.status(400).json({ message: "Duel is not finished yet" });

    const isPlayer1 = oldRoom.player1.userId.toString() === userId.toString();
    const isPlayer2 = oldRoom.player2?.userId?.toString() === userId.toString();
    if (!isPlayer1 && !isPlayer2) return res.status(403).json({ message: "You were not part of this duel" });

    const opponentId = isPlayer1 ? oldRoom.player2?.userId : oldRoom.player1.userId;
    if (!opponentId) return res.status(400).json({ message: "Opponent not found for rematch" });

    const difficulty = oldRoom.problemId.difficulty;

    // pick a new random problem, same difficulty, excluding the one just played
    const candidates = await Problem.find({
      difficulty,
      _id: { $ne: oldRoom.problemId._id }
    }).select('_id');

    const newProblemId = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]._id
      : oldRoom.problemId._id; // fallback if no other problem exists at this difficulty

    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await DuelRoom.findOne({ roomCode });
    }

    const newRoom = await DuelRoom.create({
      roomCode,
      problemId: newProblemId,
      timeLimit: oldRoom.timeLimit,
      player1: { userId },
      rematchOf: oldRoom._id
    });

    const newProblem = await Problem.findById(newProblemId);

    const io = req.app.get("io");
    // notify the opponent (they're likely still connected to the old room's socket channel)
    io.to(oldRoom.roomCode).emit("duel:rematch_invite", {
      fromUserId: userId,
      roomCode: newRoom.roomCode,
      roomId: newRoom._id,
      problem: { id: newProblem._id, title: newProblem.title, difficulty: newProblem.difficulty }
    });

    res.status(201).json({
      roomCode: newRoom.roomCode,
      roomId: newRoom._id,
      problem: { id: newProblem._id, title: newProblem.title, difficulty: newProblem.difficulty },
      timeLimit: newRoom.timeLimit,
      message: "Rematch room created! Waiting for opponent to join."
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ NEW: POST-DUEL REPLAY — both players' final code, side by side
const getDuelReplay = async (req, res) => {
  try {
    const { roomId } = req.params;

    const duelRoom = await DuelRoom.findById(roomId)
      .populate('problemId', 'title difficulty')
      .populate('player1.userId', 'firstName')
      .populate('player2.userId', 'firstName')
      .populate('winnerId', 'firstName');

    if (!duelRoom) return res.status(404).json({ message: "Room not found" });
    if (duelRoom.status !== 'finished') return res.status(400).json({ message: "Duel is not finished yet" });

    res.status(200).json({
      problem: duelRoom.problemId,
      winnerId: duelRoom.winnerId,
      player1: {
        userId: duelRoom.player1.userId,
        code: duelRoom.player1.code,
        language: duelRoom.player1.language,
        testCasesPassed: duelRoom.player1.testCasesPassed,
        totalTestCases: duelRoom.player1.totalTestCases,
        runtime: duelRoom.player1.runtime,
        memory: duelRoom.player1.memory,
        status: duelRoom.player1.status,
        submittedAt: duelRoom.player1.submittedAt
      },
      player2: duelRoom.player2 ? {
        userId: duelRoom.player2.userId,
        code: duelRoom.player2.code,
        language: duelRoom.player2.language,
        testCasesPassed: duelRoom.player2.testCasesPassed,
        totalTestCases: duelRoom.player2.totalTestCases,
        runtime: duelRoom.player2.runtime,
        memory: duelRoom.player2.memory,
        status: duelRoom.player2.status,
        submittedAt: duelRoom.player2.submittedAt
      } : null,
      startedAt: duelRoom.startedAt,
      finishedAt: duelRoom.finishedAt
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── GET DUEL ROOM INFO ───────────────────────────────────────────────────────
const getDuelRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const duelRoom = await DuelRoom.findOne({ roomCode })
      .populate('problemId', 'title difficulty description visibleTestCases startCode tags driverCode hiddenTestCases')
      .populate('player1.userId', 'firstName')
      .populate('player2.userId', 'firstName')
      .populate('winnerId', 'firstName');

    if (!duelRoom) return res.status(404).json({ message: "Room not found" });

    res.status(200).json(duelRoom);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── GET DUEL STATS ───────────────────────────────────────────────────────────
const getDuelStats = async (req, res) => {
  try {
    const userId = req.result._id;
    const stats = await getOrCreateStats(userId);

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
  getDuelLeaderboard,
  rematchDuel,      // ✅ NEW
  getDuelReplay      // ✅ NEW
};