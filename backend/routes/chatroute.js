const express = require("express");
const router = express.Router();
const client = require("../config/redis");
const User = require("../models/Userschema");
const userAuth = require("../middleware/userAuth");

router.get("/admins", userAuth, async (req, res) => {
  try {
    const requester = req.result;

    // TEMP DEBUG — remove after confirming the fix
    console.log("=== /api/admins debug ===");
    console.log("requester._id:", requester._id);
    console.log("requester.role:", JSON.stringify(requester.role)); // JSON.stringify reveals hidden spaces/casing
    console.log("requester.collegeId:", requester.collegeId);

    const filter = { role: "CollageAdmin" };

    if (requester.role !== "Admin") {
      if (!requester.collegeId) {
        console.log("BLOCKED: role !== 'Admin' AND no collegeId -> returning []");
        return res.json([]);
      }
      filter.collegeId = requester.collegeId;
    }

    console.log("Final Mongo filter:", filter);

    const totalCollageAdmins = await User.countDocuments({ role: "CollageAdmin" });
    console.log("Total users with role='CollageAdmin' in DB:", totalCollageAdmins);

    const admins = await User.find(filter)
      .select("-password")
      .populate("collegeId", "Collage_name collegeCode");

    console.log("Matched admins count:", admins.length);
    console.log("=========================");

    const onlineAdminIds = await client.sMembers("online_admins");

    const result = admins.map((admin) => ({
      ...admin.toObject(),
      isOnline: onlineAdminIds.includes(admin._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/admins error:", err);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

module.exports = router;