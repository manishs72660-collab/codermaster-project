const { getLanguageById, submitBatch, submitToken } = require("../utils/probelmutlity");
const Problem = require("../models/problemschema");
const SolutionVideo = require("../models/solutionvideo");

const updateproblem = async (req, res) => {
  const { id } = req.params;
  const { title, description, difficulty, tags,
    visibleTestCases, hiddenTestCases, startCode,
    referenceSolution, problemCreator
  } = req.body;
  try {

    if (!id) {
      return res.status(400).send("Missing ID Field");
    }

    const DsaProblem = await Problem.findById(id);
    if (!DsaProblem) {
      return res.status(404).send("ID is not persent in server");
    }

    for (const { language, completeCode } of referenceSolution) {

      const languageId = getLanguageById(language);

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
      }));

      const submitResult = await submitBatch(submissions);
      const resultToken = submitResult.map((value) => value.token);
      const testResult = await submitToken(resultToken);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).send("Error Occured");
        }
      }

    }

    const newProblem = await Problem.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });
    res.status(200).send(newProblem);
  }
  catch (err) {
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

    const getProblem = await Problem.find({}).select('_id title difficulty tags');

    if (getProblem.length == 0)
      return res.status(404).send("Problem is Missing");
    res.status(200).send(getProblem);
  }
  catch (err) {
    res.status(500).send("Error: " + err);
  }
}

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