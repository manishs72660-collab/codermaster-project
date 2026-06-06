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
    driverCode,        // ✅ NEW
    referenceSolution
  } = req.body;

  try {
    // Validate reference solution using driverCode wrapping
    // referenceSolution now only has the function (solutionCode)
    // BUT to stay backward compatible, if completeCode exists we use it directly
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
      driverCode,          // ✅ saved to DB
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