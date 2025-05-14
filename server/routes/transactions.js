const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

// Get all transactions
router.get("/", transactionController.getTransactions);

// Get transaction by ID
router.get("/:id", transactionController.getTransactionById);

// Get transactions by user ID
router.get("/user/:userId", transactionController.getTransactionsByUserId);

// Create a new transaction
router.post("/", transactionController.createTransaction);

// Update a transaction
router.put("/:id", transactionController.updateTransaction);

// Delete a transaction
router.delete("/:id", transactionController.deleteTransaction);

module.exports = router;
