const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Userproblem = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'problem',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'wrong', 'error'],
    default: 'pending'
  },
  difficulty: {
  type: String,
  enum: ["easy", "medium", "hard"]
  },
},
 { 
  timestamps: true
});


const userproblem = mongoose.model('userproblem',Userproblem);
Userproblem.index({ userId: 1, status: 1, createdAt: -1 });
module.exports = userproblem;