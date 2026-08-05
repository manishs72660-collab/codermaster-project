const redisClient=require("../config/redis");
const windowSize = 3600;
const MaxRequest = 60;

const rateLimiter = async (req,res,next)=>{

    try{
        const key = `IP:${req.ip}`;
        const current_time = Date.now()/1000;
        const window_Time = current_time - windowSize;
        await redisClient.zRemRangeByScore(key, 0, window_Time);

        const numberOfRequest = await redisClient.zCard(key);
        // if(numberOfRequest>=MaxRequest){
        //     throw new Error("Number of Request Exceeded");
        // }

        await redisClient.zAdd(key,[{score:current_time, value:`${current_time}:${Math.random()}`}]);
        await redisClient.expire(key,windowSize);
        next();
    }
    catch(err){
        res.send("Error: "+err);
    }

}


module.exports = rateLimiter;