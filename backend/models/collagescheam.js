const mongoose = require('mongoose');
const { Schema } = mongoose;

const CollegeSchema = new Schema({
    Collage_name: {
        type: String,
        minLength: [3, "College name must be at least 3 characters long"],
        trim: true,
        required: true,
    },
    collegeCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    adminEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    // The User document (role: "CollageAdmin") that actually owns login
    // credentials for this college. See note in chat re: why the College
    // doc itself no longer stores a password.
    adminId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    plan: {
        type: String,
        enum: ["Free", "Pro", "Enterprise"],
        default: "Free",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const College = mongoose.model('College', CollegeSchema);
module.exports = College;