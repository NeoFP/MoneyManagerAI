const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["income", "expense"],
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // Link to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Optional fields that might be extracted from voice input
  paymentMethod: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  tags: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
