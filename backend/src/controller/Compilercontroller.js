// compilerController.js
// A standalone "run code" endpoint for the simple compiler page.
// Unlike submitCode/runCode (which run against a Problem's test cases),
// this takes raw code + language + a single custom stdin from the user
// and returns stdout / stderr / compile errors directly.

const { getLanguageById, submitBatch, submitToken } = require("../utils/Compilerjudge0");

const runCode = async (req, res) => {
  try {
    const { code, language: rawLanguage, input } = req.body;

    if (!code || !rawLanguage) {
      return res.status(400).json({ message: "code and language are required" });
    }

    const language = rawLanguage === "cpp" ? "c++" : rawLanguage;
    const languageId = getLanguageById(language);

    if (!languageId) {
      return res.status(400).json({ message: `Unsupported language: ${rawLanguage}` });
    }

    // Judge0 expects an array even for a single run — batch of 1
    const submissions = [
      {
        source_code: code,
        language_id: languageId,
        stdin: input || "",
      },
    ];

    // Submit to Judge0. If the judge service itself is unreachable/down,
    // don't let that bubble up as a generic 500 — tell the user it's a
    // service issue, not something wrong with their code or our server logic.
    let submitResult;
    try {
      submitResult = await submitBatch(submissions);
    } catch (err) {
      console.error("Judge0 submitBatch failed:", err.message);
      return res.status(502).json({
        message: `Couldn't reach the code execution service: ${err.message}`,
      });
    }

    const resultToken = submitResult.map((value) => value.token);

    let testResult;
    try {
      testResult = await submitToken(resultToken);
    } catch (err) {
      console.error("Judge0 submitToken failed:", err.message);
      return res.status(502).json({
        message: err.message, // e.g. "Judge0 poll failed (429): ..." or a genuine timeout
      });
    }

    // testResult is an array with a single Judge0 result object
    const result = testResult?.[0];

    if (!result) {
      console.error("Judge0 returned no result for tokens:", resultToken);
      return res.status(502).json({ message: "No result returned from the execution service." });
    }

    // Judge0 status_id meanings we care about:
    // 1/2 = queued/processing (shouldn't happen after polling), 3 = accepted,
    // 5 = TLE, 6 = compilation error, 7-12 = various runtime errors
    // (runtime error - SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, other),
    // 13+ = Judge0-internal failures (not the user's fault).
    const statusId = result.status_id;

    let outcome = "success";
    if (statusId === 3) outcome = "success";
    else if (statusId === 5) outcome = "timeout";
    else if (statusId === 6) outcome = "compile_error";
    else if (statusId >= 7 && statusId <= 12) outcome = "runtime_error";
    else if (statusId >= 13) outcome = "internal_error";

    return res.status(200).json({
      outcome,
      statusDescription: result.status?.description || null,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      compileOutput: result.compile_output || "",
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    console.error("runCode unexpected error:", err);
    return res.status(500).json({
      message: "Something went wrong while running your code. Please try again.",
    });
  }
};

module.exports = { runCode };