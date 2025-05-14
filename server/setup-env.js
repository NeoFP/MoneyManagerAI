/**
 * This script helps create the .env file in the server directory.
 * Run this with: node server/setup-env.js YOUR_GEMINI_API_KEY
 */

const fs = require("fs");
const path = require("path");

// Get API key from command line
const apiKey = process.argv[2];

if (!apiKey) {
  console.error("ERROR: Please provide your Gemini API key as an argument.");
  console.error("Usage: node server/setup-env.js YOUR_GEMINI_API_KEY");
  process.exit(1);
}

// Create .env file content
const envContent = `GEMINI_API_KEY=${apiKey}
MONGODB_URI=mongodb://localhost:27017/finance_app
`;

// Path to .env file
const envPath = path.join(__dirname, ".env");

// Write to file
fs.writeFileSync(envPath, envContent);

console.log(`SUCCESS: .env file created at ${envPath}`);
console.log("You can now restart your server to use the Gemini API.");
