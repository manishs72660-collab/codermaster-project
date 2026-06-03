const { getLanguageById, submitBatch, submitToken } = require("../utils/probelmutlity");
const Problem = require("../models/problemschema");

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution
  } = req.body;
  try {
    // Validate each reference solution against visible test cases only
    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language); // throws if language is invalid

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
      }));

      const submitResult = await submitBatch(submissions);
      const resultTokens = submitResult.map((value) => value.token);
      const testResult = await submitToken(resultTokens);

      for (const test of testResult) {
        if (test.status_id !== 3) {
          // FIXED: added return so loop stops and no "headers already sent" crash
          return res.status(400).json({
            message: `Wrong answer for language: ${language}`,
            details: test
          });
        }
      }
    }
    const existing = await Problem.findOne({ title });
    if (existing) {
      return res.status(409).json({ message: "Problem already exists" });
    }
    const allHiddenTestCases = [...visibleTestCases, ...hiddenTestCases];
    await Problem.create({
      title,
      description,
      difficulty,
      tags,
      visibleTestCases,
      hiddenTestCases: allHiddenTestCases,
      startCode,
      referenceSolution,
      problemCreator: req.result._id
    });
    res.status(201).json({ message: "Problem saved successfully" });
  } catch (err) {
    console.error("createProblem error:", err);
    // FIXED: return JSON not plain string
    res.status(500).json({ message: err.message });
  }
};

module.exports = createProblem;