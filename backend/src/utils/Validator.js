const validator = require("validator");
const User=require("../models/Userschema");
async function validUser(data){
const mandatoryField = ["firstName","emailId","password"]
        const IsAllowed = mandatoryField.every((k)=> Object.keys(data).includes(k));
        if(!IsAllowed)
            throw new Error("Fields Missing");
        const {emailId}=data;
        const isexit=await User.exists({ emailId });
        if(isexit){
            throw new Error("user user already exit");
        }
        if(!validator.isEmail(data.emailId))
            throw new Error("Invalid Email");
        if(!(data.firstName.length>=3 && data.firstName.length<=20))
            throw new Error("Name should have atleast 3 char and atmost 20 char");
};

module.exports = validUser;