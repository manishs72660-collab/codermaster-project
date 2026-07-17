const mongoose = require('mongoose');
const { Schema } = mongoose;

const contestSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    problems: [
        {
            type: Schema.Types.ObjectId,
            ref: 'problem',
        }
    ],
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    // Only set when isPublic === false. Used to join a private contest
    // via POST /contest/join instead of the open /contest/:id/register route.
    joinCode: {
        type: String,
        default: null,
        index: true,
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'ended'],
        default: 'upcoming',
    }
}, { timestamps: true });

// Auto-update status based on time
contestSchema.virtual('computedStatus').get(function () {
    const now = new Date();
    if (now < this.startTime) return 'upcoming';
    if (now >= this.startTime && now <= this.endTime) return 'ongoing';
    return 'ended';
});

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;