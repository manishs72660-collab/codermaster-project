const express = require("express");
const userAuth=require("../middleware/userauth")
const {
  submitHLD,
  getHLDSubmission,
} = require("../controller/designSubmissionController");

const router = express.Router();

router.post(
  "/:problemId/submit",
  userAuth,
  submitHLD
);

router.get(
  "/result/:submissionId",
  userAuth,
  getHLDSubmission
);

module.exports = router;