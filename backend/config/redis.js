const{ createClient } =require("redis");

const client = createClient({
    username: 'default',
    password: "gFY9FPqpbma90oSjAdwRZBIGPgVkhXLU",
    socket: {
        host: 'redis-15248.c275.us-east-1-4.ec2.cloud.redislabs.com',
        port: 15248
    },
});
module.exports=client;
