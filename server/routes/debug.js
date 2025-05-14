const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Get all users (for debugging)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Get all transactions (for debugging)
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
