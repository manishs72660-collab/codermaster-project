const { Worker } = require('bullmq');
const Problem = require('../models/problemschema');
const Submission = require('../models/Submission');
const userProblem = require('../models/Userdetail');
const { getLanguageById, submitBatch, submitToken } = require('../utils/probelmutlity');
const { buildFullCode } = require('../controller/userproblem');

const connection = {
  host: process.env.REDISH_HOST,
  port: 15248,
  password: process.env.REDISH_KEY,
  username: "default",
  maxRetriesPerRequest: null,
};

const submissionWorker = new Worker('code-submission', async (job) => {
    const { submissionId, problemId, userId, code, language, socketId } = job.data;

    try {
        const problem = await Problem.findById(problemId);
        if (!problem) throw new Error('Problem not found');

        const driverEntry = problem.driverCode?.find(
            (d) => d.language.toLowerCase() === language.toLowerCase()
        );
        if (!driverEntry) throw new Error(`No driver code for language: ${language}`);

        const fullCode = buildFullCode(code, driverEntry.code, language);
        const languageId = getLanguageById(language);

        const submissions = problem.hiddenTestCases.map((testcase) => ({
            source_code: fullCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output.trim(), // 🔥 Space fix
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
            // Judge0 status 3 = Accepted
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time || 0);
                memory = Math.max(memory, test.memory || 0);
            } else {
                status = test.status_id === 4 ? "error" : "wrong";
                errorMessage = test.stderr || test.compile_output || null;
            }
        }

        const submittedResult = await Submission.findById(submissionId);
        if (submittedResult) {
            submittedResult.status = status;
            submittedResult.testCasesPassed = testCasesPassed;
            submittedResult.errorMessage = errorMessage;
            submittedResult.runtime = runtime;
            submittedResult.memory = memory;
            await submittedResult.save();

            if (status === "accepted") {
                const isPresent = await userProblem.exists({ userId, problemId });
                if (!isPresent) {
                    await userProblem.create({
                        userId,
                        problemId,
                        status: "accepted",
                        difficulty: problem.difficulty,
                    });
                }
            }
        }

        const io = global.io; 
        const payload = {
            submissionId,
            accepted: status === "accepted",
            totalTestCases: problem.hiddenTestCases.length,
            passedTestCases: testCasesPassed,
            runtime,
            memory,
            errorMessage
        };

        // 🔥 FRONTEND KO RESULT BHEJO (Dono tariko se try karega)
        if (io) {
            if (socketId) {
                io.to(socketId).emit('submission_result', payload); // Agar frontend ne ID bheji hai
            }
            io.to(`user-${userId}`).emit('submission_result', payload); // Fallback room
        }

        return { success: true, status };

    } catch (error) {
        console.error(`Error processing submission ${submissionId}:`, error);
        throw error; 
    }
}, { connection, concurrency: 10 });

module.exports = submissionWorker;