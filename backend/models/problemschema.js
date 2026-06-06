const mongoose = require('mongoose');
const {Schema} = mongoose;

const problemSchema = new Schema({
    title:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    difficulty:{
        type:String,
        enum:['easy','medium','hard'],
        required:true,
    },
    tags:{
        type:String,
        enum:['array','linkedList','graph','dp','string'],
        required:true
    },
    visibleTestCases:[
        {
            input:{
                type:String,
                required:true,
            },
            output:{
                type:String,
                required:true,
            },
            explanation:{
                type:String,
                required:true
            }
        }
    ],

    hiddenTestCases:[
        {
            input:{
                type:String,
                required:true,
            },
            output:{
                type:String,
                required:true,
            }
        }
    ],

    startCode: [
        {
            language:{
                type:String,
                required:true,
            },
            initialCode:{
                type:String,
                required:true
            }
        }
    ],
driverCode: [
        {
            language: { type: String, required: true },
            code: { type: String, required: true }
        }
    ],
    referenceSolution: [
    {
        language: { type: String, required: true },
        completeCode: { type: String },   // ✅ removed required
        solutionCode: { type: String }    // ✅ added
    }
],

    problemCreator:{
        type: Schema.Types.ObjectId,
        ref:'user',
        required:true
    }
})
problemSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const Problem = mongoose.model('problem',problemSchema);
module.exports = Problem;