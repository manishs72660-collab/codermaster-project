const cloudinary = require('cloudinary').v2;

const Problem = require("../models/problemschema");
const SolutionVideo = require("../models/solutionvideo");

// ================= CLOUDINARY CONFIG =================

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUD_KEY,
  api_secret:process.env.CLOUD_Secret
});

// ================= GENERATE SIGNATURE =================

const generateUploadSignature = async (req, res) => {

  try {

    const { problemId } = req.params;

    const userId = req.result._id;

    // VERIFY PROBLEM EXISTS

    const problem = await Problem.findById(problemId);

    if (!problem) {

      return res.status(404).json({
        error: "Problem not found"
      });

    }

    // GENERATE UNIQUE PUBLIC ID

    const timestamp = Math.round(Date.now() / 1000);

    const publicId =
      `codemaster-solutions/${problemId}/${userId}_${timestamp}`;

    // PARAMS TO SIGN

    const uploadParams = {
      timestamp,
      public_id: publicId
    };

    // GENERATE SIGNATURE

    const signature =
      cloudinary.utils.api_sign_request(
        uploadParams,
        process.env.CLOUD_Secret
      );

    // SEND DATA TO FRONTEND

    res.status(200).json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUD_KEY,
      cloud_name: process.env.CLOUD_Secret,
      upload_url:
        "https://api.cloudinary.com/v1_1/dl64jwdvp/video/upload"
    });

  } catch (error) {

    console.error(
      "Error generating upload signature:",
      error
    );

    res.status(500).json({
      error: "Failed to generate upload credentials"
    });

  }
};

// ================= SAVE VIDEO METADATA =================

const saveVideoMetadata = async (req, res) => {

  try {

    const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration
    } = req.body;

    const userId = req.result._id;

    // VERIFY VIDEO EXISTS ON CLOUDINARY

    const cloudinaryResource =
      await cloudinary.api.resource(
        cloudinaryPublicId,
        {
          resource_type: "video"
        }
      );

    if (!cloudinaryResource) {

      return res.status(400).json({
        error: "Video not found on Cloudinary"
      });

    }

    // CHECK DUPLICATE

    const existingVideo =
      await SolutionVideo.findOne({
        problemId,
        userId,
        cloudinaryPublicId
      });

    if (existingVideo) {

      return res.status(409).json({
        error: "Video already exists"
      });

    }

    // GENERATE THUMBNAIL

    const thumbnailUrl = cloudinary.url(
      cloudinaryResource.public_id,
      {
        resource_type: "video",
        transformation: [
          {
            width: 400,
            height: 225,
            crop: "fill"
          },
          {
            quality: "auto"
          },
          {
            start_offset: "auto"
          }
        ],
        format: "jpg"
      }
    );

    // SAVE VIDEO DATA

    const videoSolution =
      await SolutionVideo.create({
        problemId,
        userId,
        cloudinaryPublicId,
        secureUrl,
        duration:
          cloudinaryResource.duration || duration,
        thumbnailUrl
      });

    res.status(201).json({

      message: "Video uploaded successfully",

      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl:
          videoSolution.thumbnailUrl,
        duration:
          videoSolution.duration,
        uploadedAt:
          videoSolution.createdAt
      }

    });

  } catch (error) {

    console.error(
      "Error saving video metadata:",
      error
    );

    res.status(500).json({
      error: "Failed to save video metadata"
    });

  }
};

// ================= DELETE VIDEO =================

const deleteVideo = async (req, res) => {

  try {

    const { problemId } = req.params;

    const userId = req.result._id;

    // DELETE ONLY USER'S VIDEO

    const video =
      await SolutionVideo.findOneAndDelete({
        problemId,
        userId
      });

    if (!video) {

      return res.status(404).json({
        error: "Video not found"
      });

    }

    // DELETE FROM CLOUDINARY

    await cloudinary.uploader.destroy(
      video.cloudinaryPublicId,
      {
        resource_type: "video",
        invalidate: true
      }
    );

    res.status(200).json({
      message: "Video deleted successfully"
    });

  } catch (error) {

    console.error(
      "Error deleting video:",
      error
    );

    res.status(500).json({
      error: "Failed to delete video"
    });

  }
};

module.exports = {
  generateUploadSignature,
  saveVideoMetadata,
  deleteVideo
};