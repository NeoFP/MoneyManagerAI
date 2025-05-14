const Budget = require("../models/Budget");

// Get all budgets
exports.getBudgets = async (req, res) => {
  try {
    // Check if userId is provided in query params for filtering
    const { userId } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    console.log("Fetching budgets with query:", query);
    const budgets = await Budget.find(query).sort({ createdAt: -1 });
    console.log(`Found ${budgets.length} budgets`);

    return res.status(200).json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get budget by ID
exports.getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    return res.status(200).json(budget);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get budgets by user ID
exports.getBudgetsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching budgets for user:", userId);

    const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${budgets.length} budgets for user ${userId}`);

    return res.status(200).json(budgets);
  } catch (error) {
    console.error("Error fetching user budgets:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Create a new budget
exports.createBudget = async (req, res) => {
  try {
    console.log("Creating budget with data:", req.body);

    // Check for duplicate category for this user
    const existingBudget = await Budget.findOne({
      userId: req.body.userId,
      category: req.body.category,
    });

    if (existingBudget) {
      return res.status(400).json({
        error: `A budget for ${req.body.category} already exists for this user`,
      });
    }

    const newBudget = new Budget(req.body);
    console.log("New budget instance:", newBudget);

    const savedBudget = await newBudget.save();
    console.log("Budget saved to database:", savedBudget);

    return res.status(201).json(savedBudget);
  } catch (error) {
    console.error("Error creating budget:", error);
    return res.status(400).json({ error: error.message });
  }
};

// Update a budget
exports.updateBudget = async (req, res) => {
  try {
    console.log(`Updating budget ${req.params.id} with data:`, req.body);

    // If category is being changed, check for duplicate
    if (req.body.category) {
      const budget = await Budget.findById(req.params.id);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }

      if (budget.category !== req.body.category) {
        const existingBudget = await Budget.findOne({
          userId: budget.userId,
          category: req.body.category,
          _id: { $ne: req.params.id },
        });

        if (existingBudget) {
          return res.status(400).json({
            error: `A budget for ${req.body.category} already exists for this user`,
          });
        }
      }
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBudget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    console.log("Budget updated:", updatedBudget);
    return res.status(200).json(updatedBudget);
  } catch (error) {
    console.error("Error updating budget:", error);
    return res.status(400).json({ error: error.message });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    console.log(`Deleting budget with ID: ${req.params.id}`);
    const budget = await Budget.findByIdAndDelete(req.params.id);

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    return res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return res.status(500).json({ error: error.message });
  }
};
