# Finance App Backend

A simple backend for a finance app with voice recognition capabilities using MongoDB and Google's Gemini API.

## Setup

1. Create a `.env` file in the server directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_app
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Install MongoDB locally or use MongoDB Atlas

   - For local installation, follow the instructions at: https://docs.mongodb.com/manual/installation/
   - Make sure MongoDB is running locally on port 27017

3. Get a Gemini API key from Google AI Studio
   - Visit: https://makersuite.google.com/app/apikey
   - Create an API key and add it to your `.env` file

## Running the backend

1. Navigate to the server directory

```
cd server
```

2. Install dependencies (if not already installed)

```
npm install
```

3. Start the server

```
node server.js
```

The server will run on port 5000 by default.

## API Endpoints

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Voice Processing

- `POST /api/voice/process` - Process voice input and create a transaction

## Example Voice Input

You can send a POST request to `/api/voice/process` with a body like:

```json
{
  "text": "I spent $45 on groceries at Trader Joe's yesterday using my credit card"
}
```

The Gemini API will parse this and create a transaction entry.
