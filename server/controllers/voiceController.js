const { GoogleGenerativeAI } = require("@google/generative-ai");
const Transaction = require("../models/Transaction");

// API key directly in the file
const GEMINI_API_KEY = "AIzaSyDm0LizqLWzlUIsrkF-IkCAltocT6ckMcg";
console.log("Using direct API key configuration");

// Initialize Gemini AI with direct API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

    // Regular processing with Gemini API
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
      
      Only output a valid JSON object with double quotes around keys and string values. 
      Do not include any other text or markdown formatting.
    `;

    console.log("Sending prompt to Gemini:", prompt);

    try {
      // Generate content with Gemini using an updated model name
      // Updated from gemini-pro to gemini-1.5-flash-002 which is more reliable
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-002",
        // Setting safety settings to avoid blocking
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      });

      // Using streaming to avoid RECITATION errors
      const result = await model.generateContentStream(prompt);
      let fullResponse = "";

      // Collect the streamed response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
      }

      console.log("Gemini response:", fullResponse);

      // Parse the JSON output from Gemini
      try {
        // Clean the response - handle markdown code blocks and any formatting
        let cleanedContent = fullResponse.trim();

        // Remove markdown code blocks if present
        if (cleanedContent.startsWith("```")) {
          // Find where the JSON actually starts after the opening backticks
          const jsonStartIndex = cleanedContent.indexOf("{");
          const jsonEndIndex = cleanedContent.lastIndexOf("}");

          if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            cleanedContent = cleanedContent.substring(
              jsonStartIndex,
              jsonEndIndex + 1
            );
          } else {
            throw new Error("Could not locate valid JSON in the response");
          }
        }

        console.log("Cleaned JSON content:", cleanedContent);
        const transactionData = JSON.parse(cleanedContent);
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

        // Fall back to basic parsing if we can't parse the JSON
        console.log("Using fallback response due to JSON parsing error");
        return useFallbackResponse(text, userId, res);
      }
    } catch (aiError) {
      console.error("Gemini API error:", aiError);

      // Fallback to basic parsing if Gemini fails
      console.log("Using fallback response due to Gemini API error");
      return useFallbackResponse(text, userId, res);
    }
  } catch (error) {
    console.error("Voice processing error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Helper function for fallback response
const useFallbackResponse = async (text, userId, res) => {
  // Create a simple transaction based on the text
  const mockTransaction = {
    type:
      text.toLowerCase().includes("spent") ||
      text.toLowerCase().includes("spend") ||
      text.toLowerCase().includes("spending") ||
      text.toLowerCase().includes("paid") ||
      text.toLowerCase().includes("pay") ||
      text.toLowerCase().includes("bought") ||
      text.toLowerCase().includes("buy")
        ? "expense"
        : "income",
    amount: parseFloat(text.match(/\$?(\d+(\.\d+)?)/)?.[1] || "0"),
    category: text.toLowerCase().includes("groceries")
      ? "Groceries"
      : text.toLowerCase().includes("salary")
      ? "Salary"
      : text.toLowerCase().includes("transport") ||
        text.toLowerCase().includes("uber") ||
        text.toLowerCase().includes("taxi")
      ? "Transportation"
      : "Other",
    description: text,
    date: new Date().toISOString().split("T")[0],
    userId: userId,
    paymentMethod: "",
    location: "",
    tags: [],
  };

  // Create and save the transaction
  const newTransaction = new Transaction(mockTransaction);
  console.log("New transaction instance (fallback):", newTransaction);

  const savedTransaction = await newTransaction.save();
  console.log("Transaction saved to database:", savedTransaction);

  return res.status(201).json({
    success: true,
    message: "Voice input processed with fallback system (API error)",
    transaction: savedTransaction,
  });
};
