const express = require("express");
const jwt = require("jsonwebtoken");
const communityRouter = express.Router();

const userAuth = require("../middleware/userAuth");
const User = require("../models/Userschema");
const client = require("../config/redis");

/*
  optionalAuth: for read-only routes (feed, single post) that should work
  for logged-out visitors too. If a valid accessToken cookie is present,
  it attaches req.result (same shape as userAuth) so the controller can
  mark isUpvoted/isRegistered-type flags. If there's no token, or it's
  invalid/expired/blocked, it just moves on with req.result = undefined
  instead of 401-ing.
*/
const optionalAuth = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) return next();

    const isBlocked = await client.exists(`token:${accessToken}`);
    if (isBlocked) return next();

    let payload;
    try {
      payload = jwt.verify(accessToken, process.env.JWT_KEY);
    } catch (err) {
      return next(); // expired/invalid — treat as logged out, don't block
    }

    if (!payload?._id) return next();

    const result = await User.findById(payload._id);
    if (result) req.result = result;

    next();
  } catch (err) {
    next(); // never block a read route because of an auth hiccup
  }
};

const {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  toggleUpvotePost,
  addComment,
  deleteComment,
  toggleUpvoteComment,
} = require("../controller/Communitycontroller");

// Feed — public, but shows isUpvoted/etc. correctly if logged in
communityRouter.get("/posts", optionalAuth, getAllPosts);          // ?tag=&sort=&page=&limit=&search=
communityRouter.get("/posts/:id", optionalAuth, getPostById);

// Post CRUD
communityRouter.post("/posts", userAuth, createPost);
communityRouter.delete("/posts/:id", userAuth, deletePost);

// Upvotes
communityRouter.post("/posts/:id/upvote", userAuth, toggleUpvotePost);
communityRouter.post("/posts/:id/comments/:commentId/upvote", userAuth, toggleUpvoteComment);

// Comments
communityRouter.post("/posts/:id/comments", userAuth, addComment);
communityRouter.delete("/posts/:id/comments/:commentId", userAuth, deleteComment);

module.exports = communityRouter;

/*
  In server.js:

  const communityRouter = require("./routes/communityroute");
  app.use("/community", communityRouter);
*/