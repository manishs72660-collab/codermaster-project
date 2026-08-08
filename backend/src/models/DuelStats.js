const mongoose = require('mongoose');
const { Schema } = mongoose;

const duelStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // ✅ fixed: 'user' -> 'User'
  rating: { type: Number, default: 1000 },    // ELO starts at 1000
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  totalDuels: { type: Number, default: 0 },
  winStreak: { type: Number, default: 0 },
  bestRating: { type: Number, default: 1000 }
}, { timestamps: true });

const DuelStats = mongoose.model('duelstats', duelStatsSchema);
module.exports = DuelStats;