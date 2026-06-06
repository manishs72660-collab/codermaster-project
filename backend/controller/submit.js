const Problem = require("../models/problemschema");
const Submission = require("../models/Submission");
const { getLanguageById, submitBatch, submitToken } = require("../utils/probelmutlity");
const userProblem = require("../models/Userdetail");
const { buildFullCode } = require("./userproblem"); // ✅ NEW

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    const { code, language: rawLanguage } = req.body; // ✅ fixed const reassignment

    if (!userId || !code || !problemId || !rawLanguage)
      return res.status(400).json({ message: "Some fields missing" });

    const language = rawLanguage === "cpp" ? "c++" : rawLanguage; // ✅ fixed

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // ✅ Get driver code and wrap
    const driverEntry = problem.driverCode?.find(
      (d) => d.language.toLowerCase() === language.toLowerCase()
    );
    if (!driverEntry)
      return res.status(400).json({ message: `No driver code found for language: ${language}` });

    const fullCode = buildFullCode(code, driverEntry.code, language); // ✅ wrapped

    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,        // ✅ store only user's clean function
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
      difficulty: problem.difficulty,
      problemTitle: problem.title,
    });

    const languageId = getLanguageById(language);

    const submissions = problem.hiddenTestCases.map((testcase) => ({
      source_code: fullCode, // ✅ send wrapped code to Judge0
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output,
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "accepted";
    let errorMessage = null;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time);
        memory = Math.max(memory, test.memory);
      } else {
        status = test.status_id === 4 ? "error" : "wrong";
        errorMessage = test.stderr || test.compile_output || null; // ✅ catches compile errors too
      }
    }

    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;
    await submittedResult.save();

    const isPresent = await userProblem.exists({ userId, problemId });
    if (status === "accepted" && !isPresent) {
      await userProblem.create({
        userId,
        problemId,
        status: "accepted",
        difficulty: problem.difficulty,
      });
    }

    res.status(201).json({
      accepted: status === "accepted",
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory,
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


const Solvedprovlembyuser = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    const submissions = await Submission.find({ userId, problemId });
    res.send(submissions);
  } catch (err) {
    res.send("Error " + err.message);
  }
};


const solveduniqueproblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const userProblems = await userProblem.find({ userId })
      .select("problemId")
      .populate({
        path: "problemId",
        select: "_id title"
      })
      .lean();
    res.send(userProblems);
  } catch (error) {
    console.error("Error fetching problems by user:", error);
    res.status(500).json({
      message: "Failed to fetch problems",
      error: error.message,
    });
  }
};


const userstate = async (req, res) => {
  try {
    const userId = req.result._id;
    const stats = await userProblem.aggregate([
      {
        $match: {
          userId,
          status: "accepted"
        }
      },
      {
        $group: {
          _id: "$problemId",
          difficulty: { $first: "$difficulty" }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          easy: {
            $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] }
          },
          hard: {
            $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] }
          }
        }
      }
    ]);

    const userStats = stats[0] || { total: 0, easy: 0, medium: 0, hard: 0 };

    const betterUsers = await userProblem.aggregate([
      { $match: { status: "accepted" } },
      {
        $group: {
          _id: { userId: "$userId", problemId: "$problemId" }
        }
      },
      {
        $group: {
          _id: "$_id.userId",
          solvedCount: { $sum: 1 }
        }
      },
      { $match: { solvedCount: { $gt: userStats.total } } },
      { $count: "count" }
    ]);

    const rank = (betterUsers[0]?.count || 0) + 1;

    return res.status(200).json({
      total: userStats.total,
      easy: userStats.easy,
      medium: userStats.medium,
      hard: userStats.hard,
      rank,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    const { code, language: rawLanguage } = req.body;

    if (!userId || !code || !problemId || !rawLanguage)
      return res.status(400).json({ message: "Some fields missing" });

    const language = rawLanguage === "cpp" ? "c++" : rawLanguage;

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const driverEntry = problem.driverCode?.find(
      (d) => d.language.toLowerCase() === language.toLowerCase()
    );
    if (!driverEntry)
      return res.status(400).json({ message: `No driver code found for language: ${language}` });

    const fullCode = buildFullCode(code, driverEntry.code, language);

    const languageId = getLanguageById(language);

    const submissions = problem.visibleTestCases.map((testcase) => ({
      source_code: fullCode,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output,
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time);
        memory = Math.max(memory, test.memory);
      } else {
        status = false;
        errorMessage = test.stderr || test.compile_output || null;
      }
    }

    res.status(200).json({
      success: status,
      testCases: testResult,
      runtime,
      memory,
    });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


const userrank = async (req, res) => {
  try {
    const userId = req.result._id;
    const currentUserStats = await userProblem.countDocuments({ userId });

    const higherUsers = await userProblem.aggregate([
      {
        $group: {
          _id: "$userId",
          totalSolved: { $sum: 1 }
        }
      },
      { $match: { totalSolved: { $gt: currentUserStats } } },
      { $count: "rank" }
    ]);

    const rank = (higherUsers[0]?.rank || 0) + 1;
    res.send({ rank });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};


const streak = async (req, res) => {
  try {
    const userId = req.result._id;

    const solvedDates = await userProblem.aggregate([
      { $match: { userId, status: "accepted" } },
      {
        $project: {
          solvedDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          }
        }
      },
      { $group: { _id: "$solvedDate" } },
      { $sort: { _id: -1 } }
    ]);

    if (!solvedDates.length) {
      return res.status(200).json({ streak: 0 });
    }

    const dates = solvedDates.map((item) => item._id);

    let expectedDate = new Date();
    expectedDate.setUTCHours(0, 0, 0, 0);

    let currentStreak = 0;

    for (const dateStr of dates) {
      const solvedDate = new Date(dateStr + "T00:00:00.000Z");
      if (solvedDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else if (solvedDate.getTime() > expectedDate.getTime()) {
        continue;
      } else {
        break;
      }
    }

    return res.status(200).json({ streak: currentStreak });

  } catch (error) {
    console.error("Error calculating streak:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  submitCode,
  Solvedprovlembyuser,
  userstate,
  runCode,
  userrank,
  streak,
  solveduniqueproblem
};