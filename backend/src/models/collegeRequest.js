const mongoose = require("mongoose");
const { Schema } = mongoose;

const collegeRequestSchema = new Schema(
  {
    Collage_name: { type: String, required: true, trim: true },
    collegeCode: { type: String, required: true, trim: true, uppercase: true },
    adminFirstName: { type: String, required: true, trim: true },
    adminLastName: { type: String, trim: true },
    adminEmail: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: String,

    // ---- NEW: approval email delivery tracking ----------------------
    // Lets the admin dashboard show whether the approval email actually
    // reached the college admin, instead of assuming success just because
    // the approve API call returned 200. See resendApprovalEmail in the
    // controller for how these get set/used.
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    emailError: { type: String, default: null },
    emailAttempts: { type: Number, default: 0 },
    lastEmailAttemptAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollegeRequest", collegeRequestSchema);