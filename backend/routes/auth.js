const express = require("express");
const {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  profile,
  deleteUser,
  adminRegister,
} = require("../controller/auth");
const userAuth = require("../middleware/userauth");
const adminmiddleware = require("../middleware/adminmiddleware");
const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/admin/register", adminmiddleware, adminRegister);
authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.post("/refresh", refresh);
authRouter.get("/profile", userAuth, profile);
authRouter.post("/logout", userAuth, logout);
authRouter.delete("/deleteuser", userAuth, deleteUser);
authRouter.get("/check", userAuth, (req, res) => {
  const reply = {
    firstName: req.result.firstName,
    emailId: req.result.emailId,
    _id: req.result._id,
    role: req.result.role,
  };

  res.status(200).json({
    user: reply,
    message: "Valid User",
  });
});

module.exports = authRouter;