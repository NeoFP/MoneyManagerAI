const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const transactionRoutes = require("./routes/transactions");
const voiceRoutes = require("./routes/voice");
const authRoutes = require("./routes/auth");
const debugRoutes = require("./routes/debug");
const statusRoutes = require("./routes/status");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// Enhanced MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/finance_app";
console.log("Connecting to MongoDB at:", MONGODB_URI);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");

    // Log collections in the database
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error("Error listing collections:", err);
      } else {
        console.log(
          "Available collections:",
          collections.map((c) => c.name)
        );
      }
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Connection details:", {
      uri: MONGODB_URI,
      mongooseVersion: mongoose.version,
    });
  });

// Listen for MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/status", statusRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Finance App API is running");
});

// Debug route for MongoDB connection status
app.get("/api/status", (req, res) => {
  const status = {
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      state: ["disconnected", "connected", "connecting", "disconnecting"][
        mongoose.connection.readyState
      ],
    },
    api: "running",
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(status);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
