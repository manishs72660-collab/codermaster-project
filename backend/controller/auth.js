const validator=require("../utils/Validator")
const bcrypt=require("bcrypt");
const User=require("../models/Userschema");
const jwt=require("jsonwebtoken");
const client=require("../config/redis");
const Submission=require("../models/Submission");
const register=async (req,res)=>{
try{ 
await validator(req.body);
const { emailId, password, firstName, lastname, age,profileImage} = req.body;
const isexit=await User.exists({ emailId });
const role="User";
const userData = {
  firstName,
  emailId,
  password: await bcrypt.hash(password, 10),
  role
};
if (lastname) userData.lastname = lastname;
if (age !== undefined) userData.age = age;
if(profileImage!==undefined)userData.profileImage=profileImage;
const user =  await User.create(userData);
const token =  jwt.sign({_id:user._id , emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
}
     res.cookie('token',token,{maxAge: 60*60*1000});
       res.status(201).json({
        user:reply,
        message:"register Successfully"
    })
    } catch(err){
        res.send("Error "+ err.message); 
    }
}
const login = async (req,res)=>{
    try{
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});
        if(!user){
           throw new Error("invalid Credentials")
        }
        const match =await bcrypt.compare(password,user.password);
        
        if(!match)
            throw new Error("Invalid Credentials");
         const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role:user.role,
        }
        const token =  jwt.sign({_id:user._id , emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
       res.cookie('token',token,{maxAge: 60*60*1000});
       res.status(201).json({
        user:reply,
        message:"Loggin Successfully"
    })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}
const logout=async(req,res)=>{
  try{
    const {token} = req.cookies;
    const payload = jwt.decode(token);
    await client.set(`token:${token}`, "Blocked");
    await client.expireAt(`token:${token}`,payload.exp);
    res.cookie("token",null,{expires: new Date(Date.now())})
    res.send("logout sucessfully");
  }catch(err){
    res.send("Error "+err.message);
  }
}
const profile=async(req,res)=>{
   try{
      res.send(req.result);
   }catch(err){
     res.send("Error "+err.message);
   }
}
const deleteUser = async (req, res) => {
    try {
        const {_id} = req.result;
        if (!id) {
            return res.status(404).send("User not found");
        }
        await User.findByIdAndDelete(_id);
        await Submission.deleteMany({userId});
        res.status(200).send("User deleted successfully");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};
const adminRegister = async(req,res)=>{
try{ 
await validator(req.body);
const { emailId, password, firstName, lastname, age,profileImage,role} = req.body;
const isexit=await User.exists({ emailId });
const userData = {
  firstName,
  emailId,
  password: await bcrypt.hash(password, 10),
  role
};
if (lastname) userData.lastname = lastname;
if (age !== undefined) userData.age = age;
if(profileImage!==undefined)userData.profileImage=profileImage;
const user =  await User.create(userData);
const token =  jwt.sign({_id:user._id , emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    } catch(err){
        res.send("Error "+ err.message); 
    }
}

module.exports={register,login,logout,profile,deleteUser,adminRegister};
