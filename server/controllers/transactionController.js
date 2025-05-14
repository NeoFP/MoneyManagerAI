const Transaction = require("../models/Transaction");

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    // Check if userId is provided in query params
    const { userId } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    console.log("Fetching transactions with query:", query);
    const transactions = await Transaction.find(query).sort({ date: -1 });
    console.log(`Found ${transactions.length} transactions`);

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get transactions by user ID
exports.getTransactionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching transactions for user:", userId);

    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    console.log(`Found ${transactions.length} transactions for user ${userId}`);

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    console.log("Creating transaction with data:", req.body);

    const newTransaction = new Transaction(req.body);
    console.log("New transaction instance:", newTransaction);

    const savedTransaction = await newTransaction.save();
    console.log("Transaction saved to database:", savedTransaction);

    return res.status(201).json(savedTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(400).json({ error: error.message });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.status(200).json(updatedTransaction);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
