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
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollegeRequest", collegeRequestSchema);