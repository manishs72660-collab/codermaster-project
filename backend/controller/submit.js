const Problem = require("../models/problemschema");
const Submission = require("../models/Submission");
const {getLanguageById,submitBatch,submitToken} = require("../utils/probelmutlity");
const userProblem=require("../models/Userdetail");
const submitCode = async (req,res)=>{
   
    // 
    try{
       const userId = req.result._id;
       const problemId = req.params.id;
       const {code,language} = req.body;     
      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some  missing");
      if(language==='cpp')
        language='c++'
    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
    //    testcases(Hidden)

    //   Kya apne submission store kar du pehle....
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length,
          difficulty: problem.difficulty,
          problemTitle: problem.title,
        })
    //    Judge0 code ko submit karna hai
    const languageId = getLanguageById(language);

    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    
    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'error'
            errorMessage = test.stderr
          }
          else{
            status = 'wrong'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
const isPresent = await userProblem.exists({
  userId,
  problemId
});

if (submittedResult.status === "accepted" && !isPresent) {
  await userProblem.create({
    userId,
    problemId,
    status: "accepted",
    difficulty: problem.difficulty
  });
}
const accepted = (status == 'accepted')
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }
}


const Solvedprovlembyuser=async (req,res) => {
  try{
  const userId=req.result._id;
  const problemId=req.params.id;
  const submissions = await Submission.find({
  userId,
  problemId
});
res.send(submissions);
   }catch(err){
    res.send("Error "+err.message);
   }
}

const solveduniqueproblem =async (req,res)=>{
  try{
      const userId=req.result._id;
      const userProblems = await userProblem.find({userId})
       .select("problemId")
  .populate({
    path: "problemId",
    select: "_id title"   // fetch only id and title from Problem collection
  })
  .lean();
      res.send(userProblems);
  }catch (error) {
    console.error("Error fetching problems by user:", error);
    res.status(500).json({
      message: "Failed to fetch problems",
      error: error.message,
    });
  }
}


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

      // Remove duplicate accepted submissions for the same problem
      {
        $group: {
          _id: "$problemId",
          difficulty: { $first: "$difficulty" }
        }
      },

      // Aggregate totals by difficulty
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          easy: {
            $sum: {
              $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0]
            }
          },
          medium: {
            $sum: {
              $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0]
            }
          },
          hard: {
            $sum: {
              $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Default values if the user has not solved any problems
    const userStats = stats[0] || {
      total: 0,
      easy: 0,
      medium: 0,
      hard: 0
    };

    // Build leaderboard counts:
    // 1. Consider only accepted submissions
    // 2. Count each (userId, problemId) only once
    // 3. Count unique solved problems per user
    // 4. Count how many users solved more than the current user
    const betterUsers = await userProblem.aggregate([
      {
        $match: {
          status: "accepted"
        }
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            problemId: "$problemId"
          }
        }
      },
      {
        $group: {
          _id: "$_id.userId",
          solvedCount: { $sum: 1 }
        }
      },
      {
        $match: {
          solvedCount: { $gt: userStats.total }
        }
      },
      {
        $count: "count"
      }
    ]);

    const rank = (betterUsers[0]?.count || 0) + 1;

    return res.status(200).json({
      total: userStats.total,
      easy: userStats.easy,
      medium: userStats.medium,
      hard: userStats.hard,
      rank
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

const runCode = async(req,res)=>{
    
     // 
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      const {code,language} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).send("Some field missing");

   //    Fetch the problem from database
      const problem =  await Problem.findById(problemId);
   //    testcases(Hidden)


   //    Judge0 code ko submit karna hai

   const languageId = getLanguageById(language);

   const submissions = problem.visibleTestCases.map((testcase)=>({
       source_code:code,
       language_id: languageId,
       stdin: testcase.input,
       expected_output: testcase.output
   }));


   const submitResult = await submitBatch(submissions);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken);

   
  
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = false
            errorMessage = test.stderr
          }
          else{
            status = false
            errorMessage = test.stderr
          }
        }
    }

   
  
   res.status(201).json({
    success:status,
    testCases: testResult,
    runtime,
    memory
   });
      
      
   }
   catch(err){
     res.status(500).send("Internal Server Error "+ err);
   }
}

const userrank=async (req,res) => {
    try{
      const currentUserStats = await userproblem.countDocuments({
  userId
});

const higherUsers = await userproblem.aggregate([
  {
    $group: {
      _id: "$userId",
      totalSolved: { $sum: 1 }
    }
  },
  {
    $match: {
      totalSolved: { $gt: currentUserStats }
    }
  },
  {
    $count: "rank"
  }
]);

const rank = (higherUsers[0]?.rank || 0) + 1;
res.send(rank);
    }catch(err){
        res.send("Error "+err.messgae);
    }
}


const streak = async (req, res) => {
  try {
    const userId = req.result._id;

    // Get all unique dates on which the user had at least one accepted submission
    const solvedDates = await userProblem.aggregate([
      {
        $match: {
          userId,
          status: "accepted"
        }
      },
      {
        $project: {
          solvedDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          }
        }
      },
      {
        $group: {
          _id: "$solvedDate"
        }
      },
      {
        $sort: {
          _id: -1 // newest to oldest
        }
      }
    ]);

    // No solved problems yet
    if (!solvedDates.length) {
      return res.status(200).json({
        streak: 0
      });
    }

    // Convert aggregation output to array of strings
    const dates = solvedDates.map(item => item._id);

    // Start checking from today (UTC midnight)
    let expectedDate = new Date();
    expectedDate.setUTCHours(0, 0, 0, 0);

    let currentStreak = 0;

    for (const dateStr of dates) {
      const solvedDate = new Date(dateStr + "T00:00:00.000Z");

      if (solvedDate.getTime() === expectedDate.getTime()) {
        // Solved on the expected day
        currentStreak++;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else if (solvedDate.getTime() > expectedDate.getTime()) {
        // Ignore any future dates (should not normally happen)
        continue;
      } else {
        // Gap detected, streak ends
        break;
      }
    }

    return res.status(200).json({
      streak: currentStreak
    });
  } catch (error) {
    console.error("Error calculating streak:", error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};






module.exports = {submitCode,Solvedprovlembyuser,userstate,runCode,userrank,streak,solveduniqueproblem};