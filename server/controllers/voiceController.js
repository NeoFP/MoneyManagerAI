const { GoogleGenerativeAI } = require("@google/generative-ai");
const Transaction = require("../models/Transaction");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "YOUR_API_KEY"
);

// Process voice input with Gemini
exports.processVoiceText = async (req, res) => {
  try {
    const { text, userId } = req.body;
    console.log("Received voice text:", text);
    console.log("User ID for transaction:", userId);

    if (!text) {
      return res.status(400).json({ error: "Voice text is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Prepare the prompt for Gemini
    const prompt = `
      Extract financial transaction information from the following voice input.
      Format the information as a valid JSON object with these fields:
      - type: Must be either "income" or "expense"
      - amount: A positive number
      - category: A relevant category (e.g., groceries, salary, entertainment)
      - description: A brief description
      - date: Today's date by default, or extract a date if mentioned
      - paymentMethod: Card, cash, etc. (if mentioned)
      - location: Where the transaction happened (if mentioned)
      - tags: Any relevant tags mentioned as an array of strings

      Voice input: "${text}"
      
      Only output a valid JSON object, nothing else.
    `;

    console.log("Sending prompt to Gemini:", prompt);

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textContent = response.text();

    console.log("Gemini response:", textContent);

    // Parse the JSON output from Gemini
    try {
      const transactionData = JSON.parse(textContent.trim());
      console.log("Parsed transaction data:", transactionData);

      // Add userId to transaction data
      transactionData.userId = userId;

      // Create and save the transaction
      const newTransaction = new Transaction(transactionData);
      console.log("New transaction instance:", newTransaction);

      const savedTransaction = await newTransaction.save();
      console.log("Transaction saved to database:", savedTransaction);

      return res.status(201).json({
        success: true,
        message: "Voice input processed successfully",
        transaction: savedTransaction,
      });
    } catch (jsonError) {
      console.error("Error parsing Gemini output:", jsonError);
      return res.status(422).json({
        error: "Could not parse transaction data from voice input",
        rawOutput: textContent,
      });
    }
  } catch (error) {
    console.error("Voice processing error:", error);
    return res.status(500).json({ error: error.message });
  }
};
