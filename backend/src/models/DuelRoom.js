const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['connected', 'submitted', 'won', 'lost'],
    default: 'connected'
  },
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  runtime: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  code: { type: String },
  language: { type: String },
  submittedAt: { type: Date }
}, { _id: false });

const duelRoomSchema = new Schema({
  roomCode: { type: String, required: true, unique: true },  // e.g "ABC123"
  problemId: { type: Schema.Types.ObjectId, ref: 'problem', required: true },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  timeLimit: { type: Number, default: 30 },   // minutes
  player1: { type: playerSchema, required: true },
  player2: { type: playerSchema },             // joins later
  winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date },
  finishedAt: { type: Date }
}, { timestamps: true });

const DuelRoom = mongoose.model('duelroom', duelRoomSchema);
module.exports = DuelRoom;