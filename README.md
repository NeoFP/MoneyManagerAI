# Finance Voice App

A simple finance application that allows users to add expenses and income using voice commands. The app uses Google's Gemini AI to parse voice input and extract transaction details.

## Features

- **Voice Input**: Record your financial transactions by speaking naturally
- **AI Processing**: Gemini AI extracts transaction details from voice input
- **Expense & Income Tracking**: Add both expenses and income to your financial records
- **Simple UI**: Clean, modern interface built with Next.js and Tailwind CSS

## Recent Updates

- **Enhanced Voice Input Dialog**: A reusable dialog component that provides voice input functionality across different pages
- **Context-Aware Voice Processing**: The system now recognizes the context (income/expense) and enhances voice commands accordingly
- **Improved AI Integration**: Updated to use Gemini 1.5 Flash for better recognition and response times
- **Consistent UI**: Standardized voice input interface across all transaction pages

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, MongoDB
- **AI**: Google Gemini API for natural language processing
- **Voice Recognition**: Web Speech API (built into modern browsers)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Google Gemini API key

### Installation

1. Clone the repository

```
git clone <repository-url>
cd finance-voice-app
```

2. Install dependencies

```
npm install --legacy-peer-deps
```

3. Create a `.env` file in the server directory with the following:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_app
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

1. Start the backend server

```
npm run server
```

2. In a separate terminal, start the Next.js frontend

```
npm run dev
```

3. Run both frontend and backend concurrently (recommended)

```
npm run dev:5001
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Voice Transactions

You can add transactions using voice input from multiple pages:

1. **Dashboard page**: Use the Voice Transaction button in the main dashboard
2. **Income page**: Click the "Add via Speech" button
3. **Expenses page**: Click the "Add via Speech" button

### How to Use Voice Input

1. Click the "Add via Speech" button on any transaction page
2. Click "Start Recording" and speak about a financial transaction
   - For expenses: "I spent $45 on groceries at Trader Joe's yesterday"
   - For income: "Got paid $2000 as salary on Friday"
3. Click "Stop Recording" when finished
4. Review the transcription
5. Click "Create Transaction from Voice" to process
6. The AI will extract transaction details and save it to the database

## AI Processing Details

The application uses Google's Gemini 1.5 Flash model to process voice commands. The system:

1. Captures your voice input through your browser
2. Sends the text to the Gemini AI
3. Extracts key transaction details (amount, category, description, date, etc.)
4. Creates a properly formatted transaction in the database

If the AI service is temporarily unavailable, the system has a robust fallback mechanism that uses rule-based parsing to extract the basic transaction details.

## Notes for University Project

This is a simple demonstration project designed for a university project. It includes:

- Basic authentication (placeholder)
- Local MongoDB storage
- Simple AI integration
- Voice recognition via browser APIs

For a production application, you would want to add:

- Robust authentication
- Data validation
- Error handling
- Production database setup
- Advanced security measures
