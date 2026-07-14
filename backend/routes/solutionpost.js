const express =require("express");
const userAuth=require("../middleware/userauth");
const {postSolution,getAllPosts,deletePost,getSinglePost}=require("../controller/solutinpost")
const postrouter=express.Router();


// postrouter.post("/post",userAuth,postSolution);
//  postrouter.post("/post/delete",userAuth,deletePost);
// postrouter.post("/post/:problemId",userAuth,getAllPosts);
// postrouter.post("/post/:postId",userAuth,getSinglePost);


postrouter.post("/post", userAuth, postSolution);
postrouter.post("/post/delete/:postId", userAuth, deletePost);
postrouter.post("/posts/:problemId", userAuth, getAllPosts);   // renamed "post" → "posts"
postrouter.post("/post/:postId", userAuth, getSinglePost);


module.exports=postrouter;