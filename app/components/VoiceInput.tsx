import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const VoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "unknown" | "online" | "offline"
  >("unknown");

  // Check if backend is online
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch (error) {
        console.error("Backend status check failed:", error);
        setBackendStatus("offline");
      }
    };

    checkBackendStatus();
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const text = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("");

          setTranscript(text);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event);
          setIsListening(false);
          toast.error("Error with speech recognition. Please try again.");
        };

        // Attach to window for access in handlers
        // @ts-ignore
        window.speechRecognition = recognition;
      } else {
        toast.error("Speech recognition is not supported in your browser.");
      }
    }
  }, []);

  const startListening = () => {
    setTranscript("");
    // @ts-ignore
    if (window.speechRecognition) {
      // @ts-ignore
      window.speechRecognition.start();
      toast.info("Listening...");
    }
  };

  const stopListening = () => {
    // @ts-ignore
    if (window.speechRecognition) {
      // @ts-ignore
      window.speechRecognition.stop();
    }
  };

  const processVoiceInput = async () => {
    if (backendStatus === "offline") {
      toast.error("Backend server is offline", {
        description:
          "The server is not running. Please start it with 'npm run server' to run on port 5001.",
      });
      return;
    }

    if (!transcript.trim()) {
      toast.error("No voice input detected");
      return;
    }

    setProcessing(true);

    try {
      console.log("Sending voice text to API:", transcript);

      const response = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: transcript }),
      });

      console.log("API response status:", response.status);

      const data = await response.json();
      console.log("API response data:", data);

      if (response.ok) {
        toast.success("Transaction created successfully!");
        setTranscript("");
      } else {
        toast.error(data.error || "Failed to process voice input");
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
      toast.error("Could not connect to the server. Is the backend running?");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">Add Transaction by Voice</h2>

      {backendStatus === "offline" && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Server Offline</AlertTitle>
          <AlertDescription>
            The backend server is not running. Please start it with 'npm run
            server' in your terminal to run on port 5001.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? "destructive" : "default"}
            className="w-full"
          >
            {isListening ? "Stop Recording" : "Start Recording"}
          </Button>

          <div className="min-h-[100px] p-4 border rounded-md bg-muted mt-2">
            {transcript ? (
              transcript
            ) : (
              <span className="text-muted-foreground">
                Your voice input will appear here...
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={processVoiceInput}
          disabled={
            !transcript ||
            processing ||
            isListening ||
            backendStatus === "offline"
          }
          className="w-full"
          variant="outline"
        >
          {processing ? "Processing..." : "Create Transaction from Voice"}
        </Button>

        <div className="text-sm text-muted-foreground mt-4">
          <p>Try saying something like:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>"I spent $45 on groceries at Trader Joe's yesterday"</li>
            <li>"Got paid $2000 as salary on Friday"</li>
            <li>"Paid $12.99 for Netflix subscription using my credit card"</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default VoiceInput;
