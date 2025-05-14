const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    period: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    alertThreshold: {
      type: Number,
      min: 1,
      max: 100,
      default: 80,
    },
    alertEnabled: {
      type: Boolean,
      default: true,
    },
    // Spent amount is calculated on the client side based on transactions
    spent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Budget", BudgetSchema);
