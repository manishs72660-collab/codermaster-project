const { getLanguageById, submitBatch, submitToken } = require("../utils/probelmutlity");
const Problem = require("../models/problemschema");

// ✅ Shared wrapper utility
const buildFullCode = (userCode, driverCode, language) => {
  switch (language.toLowerCase()) {
    case "javascript":
      return `${userCode}\n\n${driverCode}`;

    case "c++":
    case "cpp":
      return `#include <bits/stdc++.h>\nusing namespace std;\n\n${userCode}\n\n${driverCode}`;

    case "java":
      // userCode = just the method(s) (e.g. "static int firstOdd(...) { ... }")
      // driverCode = just the statements that go inside main(), NOT a full class
      return `import java.util.Scanner;\n\npublic class Main {\n    ${userCode}\n\n    public static void main(String[] args) {\n        ${driverCode}\n    }\n}`;

    case "python":
    case "python3":
      // No braces/includes needed — but userCode must sit at column 0
      // since driverCode is appended directly below it.
      return `${userCode}\n\n${driverCode}`;

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    driverCode,
    referenceSolution
  } = req.body;

  try {
    // Validate reference solution using driverCode wrapping
    for (const { language, completeCode, solutionCode } of referenceSolution) {
      const languageId = getLanguageById(language);

      let finalCode;

      if (solutionCode) {
        // ✅ New style: wrap function + driver
        const driver = driverCode?.find(
          (d) => d.language.toLowerCase() === language.toLowerCase()
        );
        if (!driver) {
          return res.status(400).json({
            message: `No driverCode found for language: ${language}`
          });
        }
        finalCode = buildFullCode(solutionCode, driver.code, language);
      } else {
        // Backward compatible: completeCode is the full code already
        finalCode = completeCode;
      }

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: finalCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
      }));

      const submitResult = await submitBatch(submissions);
      const resultTokens = submitResult.map((value) => value.token);
      const testResult = await submitToken(resultTokens);

      for (const test of testResult) {
        if (test.status_id !== 3) {
          return res.status(400).json({
            message: `Reference solution failed for language: ${language}`,
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
      driverCode,
      referenceSolution,
      problemCreator: req.result._id
    });

    res.status(201).json({ message: "Problem saved successfully" });

  } catch (err) {
    console.error("createProblem error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createProblem, buildFullCode };