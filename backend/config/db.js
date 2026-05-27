const mongoose=require("mongoose");

async function main(){
    await mongoose.connect(process.env.CONNECT_STRING);
}
module.exports=main;