const express = require("express");
const router = express.Router();
const client = require("../config/redis");
const User = require("../models/Userschema");
const userAuth = require("../middleware/userAuth"); // protect it — must be logged in to see admin list

router.get("/admins", userAuth, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    const onlineAdminIds = await client.sMembers("online_admins");

    const result = admins.map((admin) => ({
      ...admin.toObject(),
      isOnline: onlineAdminIds.includes(admin._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

module.exports = router;