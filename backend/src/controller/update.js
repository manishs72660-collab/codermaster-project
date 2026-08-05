const { getLanguageById, submitBatch, submitToken } = require("../utils/probelmutlity");
const Problem = require("../models/problemschema");
const SolutionVideo = require("../models/solutionvideo");
const { buildFullCode } = require("./userproblem"); // adjust path/filename to match your actual file

const updateproblem = async (req, res) => {
  const { id } = req.params;
  const { title, description, difficulty, tags,
    visibleTestCases, hiddenTestCases, startCode,
    driverCode, referenceSolution, problemCreator
  } = req.body;
  try {

    if (!id) {
      return res.status(400).send("Missing ID Field");
    }

    const DsaProblem = await Problem.findById(id);
    if (!DsaProblem) {
      return res.status(404).send("ID is not persent in server");
    }

    for (const { language, completeCode, solutionCode } of referenceSolution) {

      const languageId = getLanguageById(language);

      let finalCode;

      if (solutionCode) {
        // New style: wrap function + driver, same as createProblem
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
        // Backward compatible: completeCode is already the full code
        finalCode = completeCode;
      }

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: finalCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
      }));

      const submitResult = await submitBatch(submissions);
      const resultToken = submitResult.map((value) => value.token);
      const testResult = await submitToken(resultToken);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).json({
            message: `Reference solution failed for language: ${language}`,
            details: test
          });
        }
      }

    }

    const newProblem = await Problem.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });
    res.status(200).send(newProblem);
  }
  catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Error: " + err);
  }
}

const deleteproblem = async (req, res) => {
  const { id } = req.params;
  try {

    if (!id)
      return res.status(400).send("ID is Missing");

    const deletedProblem = await Problem.findByIdAndDelete(id);

    if (!deletedProblem)
      return res.status(404).send("Problem is Missing");

    res.status(200).send("Successfully Deleted");
  }
  catch (err) {

    res.status(500).send("Error: " + err);
  }
}

const getProblemforadmin = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id)
    if (!getProblem)
      return res.status(404).send("Problem is Missing");
    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
}

const getProblemById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id)
      .select('_id title description difficulty tags visibleTestCases startCode referenceSolution')
      .lean();

    if (!getProblem)
      return res.status(404).send("Problem is Missing");

    const videos = await SolutionVideo.findOne({ problemId: id });

    if (videos) {
      getProblem.secureUrl = videos.secureUrl;
      getProblem.cloudinaryPublicId = videos.cloudinaryPublicId;
      getProblem.thumbnailUrl = videos.thumbnailUrl;
      getProblem.duration = videos.duration;
    }

    res.status(200).send(getProblem);

  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getAllProblem = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
 
    const totalProblems = await Problem.countDocuments({});
    const getProblem = await Problem.find({})
      .select('_id title difficulty tags')
      .skip(skip)
      .limit(limit);
 
    if (getProblem.length === 0 && page === 1)
      return res.status(404).send("Problem is Missing");
 
    res.status(200).json({
      problems: getProblem,
      currentPage: page,
      totalProblems,                              // <-- now sent to client
      totalPages: Math.ceil(totalProblems / limit),
      hasMore: skip + getProblem.length < totalProblems,
    });
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};
const problemsearch = async (req, res) => {
  try {
    const {
      q = "",
      difficulty,
      tag,
      page = 1,
      limit = 20
    } = req.query;

    const pipeline = [];
    if (q) {
      pipeline.push({
        $search: {
          index: "problemSearch",
          compound: {
            should: [
              {
                text: {
                  query: q,
                  path: "title",
                  fuzzy: {
                    maxEdits: 2
                  }
                }
              },
              {
                text: {
                  query: q,
                  path: "description"
                }
              },
              {
                text: {
                  query: q,
                  path: "tags"
                }
              }
            ]
          }
        }
      });
    }

    const match = {};

    if (difficulty) {
      match.difficulty = difficulty;
    }

    if (tag) {
      match.tags = tag;
    }
    if (Object.keys(match).length) {
      pipeline.push({
        $match: match
      });
    }
    const results = await Problem.aggregate(pipeline);
    res.json(results);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

module.exports = { updateproblem, deleteproblem, getProblemById, getAllProblem, problemsearch, getProblemforadmin };