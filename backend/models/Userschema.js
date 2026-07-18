const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    firstName: {
        type: String,
        minLength: [3, "First name must be at least 3 characters long"],
        maxLength: [20, "First name cannot exceed 20 characters"],
        trim: true,
        required: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        minLength: [6, "Password must be at least 6 characters long"],
        required: true,
    },
    age: {
        type: Number,
        min: [5, "Age should be greater than 5"],
        max: [50, "Age cannot be greater than 50"],
    },
    role: {
        type: String,
        enum: ["Admin", "User", "CollageAdmin"],
        default: "User",
    },
    // Tenant link. Required for students ("User") and college admins
    // ("CollageAdmin") - every college-scoped API filters on this field.
    // Platform-level "Admin" accounts are not tied to any single college,
    // so it's left undefined for them.
    collegeId: {
        type: Schema.Types.ObjectId,
        ref: "College",
        required: function () {
            return this.role === "User" || this.role === "CollageAdmin";
        },
    },
    problemsolve: {
        type: [String],
    },
    profileImage: {
        type: String,
        default: "https://example.com/default-avatar.png"
    }

}, { timestamps: true });

// Every college-scoped query (student list, single student, etc.) filters
// by collegeId, so this index matters once you have more than a handful
// of users.
UserSchema.index({ collegeId: 1 });

const User = mongoose.model('User', UserSchema);
module.exports = User;