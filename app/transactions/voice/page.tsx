"use client";

import VoiceInput from "@/app/components/VoiceInput";
import { Card } from "@/components/ui/card";

export default function VoiceTransactionPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Voice Transactions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <VoiceInput />
        </div>

        <div>
          <Card className="p-6 shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4">How it works</h2>
            <ul className="list-decimal pl-5 space-y-2">
              <li>
                Click "Start Recording" and speak clearly about a transaction.
              </li>
              <li>Click "Stop Recording" when finished.</li>
              <li>Review the transcription for accuracy.</li>
              <li>Click "Create Transaction from Voice" to process.</li>
              <li>
                The AI will extract transaction details and save it to the
                database.
              </li>
            </ul>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Examples:</h3>
              <p className="text-sm text-muted-foreground">
                "I spent $45 on groceries at Trader Joe's yesterday"
              </p>
              <p className="text-sm text-muted-foreground">
                "Got paid $2000 as salary on Friday"
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
