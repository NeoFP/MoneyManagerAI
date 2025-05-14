const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Get server status
router.get("/", (req, res) => {
  const status = {
    server: "online",
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      state: ["disconnected", "connected", "connecting", "disconnecting"][
        mongoose.connection.readyState
      ],
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(status);
});

module.exports = router;
