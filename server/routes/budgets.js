const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");

// Get all budgets
router.get("/", budgetController.getBudgets);

// Get budget by ID
router.get("/:id", budgetController.getBudgetById);

// Get budgets by user ID
router.get("/user/:userId", budgetController.getBudgetsByUserId);

// Create a new budget
router.post("/", budgetController.createBudget);

// Update a budget
router.put("/:id", budgetController.updateBudget);

// Delete a budget
router.delete("/:id", budgetController.deleteBudget);

module.exports = router;
