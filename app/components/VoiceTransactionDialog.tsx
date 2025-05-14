import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type VoiceTransactionDialogProps = {
  buttonText?: string;
  transactionType?: "income" | "expense" | "both";
  onTransactionCreated?: () => void;
};

const VoiceTransactionDialog: React.FC<VoiceTransactionDialogProps> = ({
  buttonText = "Add via Speech",
  transactionType = "both",
  onTransactionCreated,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "unknown" | "online" | "offline"
  >("unknown");
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get user ID from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUserId(userData._id);
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
      }
    }
  }, []);

  // Check if backend is online
  React.useEffect(() => {
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

    if (isOpen) {
      checkBackendStatus();
    }
  }, [isOpen]);

  // Initialize SpeechRecognition
  React.useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
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
  }, [isOpen]);

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

    if (!userId) {
      toast.error("You must be logged in to create transactions");
      return;
    }

    setProcessing(true);

    try {
      console.log("Sending voice text to API:", transcript);

      // Add hints for specific transaction type if needed
      let finalText = transcript;
      if (
        transactionType === "income" &&
        !transcript.toLowerCase().includes("received") &&
        !transcript.toLowerCase().includes("earned") &&
        !transcript.toLowerCase().includes("income")
      ) {
        finalText = `received ${transcript}`;
      } else if (
        transactionType === "expense" &&
        !transcript.toLowerCase().includes("spent") &&
        !transcript.toLowerCase().includes("paid") &&
        !transcript.toLowerCase().includes("expense")
      ) {
        finalText = `spent ${transcript}`;
      }

      const response = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: finalText, userId }),
      });

      console.log("API response status:", response.status);

      const data = await response.json();
      console.log("API response data:", data);

      if (response.ok) {
        toast.success("Transaction created successfully!");
        setTranscript("");
        setIsOpen(false);
        if (onTransactionCreated) {
          onTransactionCreated();
        }
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mic className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Transaction by Voice</DialogTitle>
          <DialogDescription>
            Speak clearly to add a{" "}
            {transactionType === "both" ? "transaction" : transactionType}
          </DialogDescription>
        </DialogHeader>

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

        {!userId && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Logged In</AlertTitle>
            <AlertDescription>
              You must be logged in to create transactions. Please log in first.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              className="w-full"
              disabled={!userId}
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
              backendStatus === "offline" ||
              !userId
            }
            className="w-full"
            variant="outline"
          >
            {processing ? "Processing..." : "Create Transaction from Voice"}
          </Button>

          <div className="text-sm text-muted-foreground mt-4">
            <p>Try saying something like:</p>
            <ul className="list-disc pl-5 mt-1">
              {transactionType === "expense" || transactionType === "both" ? (
                <li>"I spent $45 on groceries at Trader Joe's yesterday"</li>
              ) : null}
              {transactionType === "income" || transactionType === "both" ? (
                <li>"Got paid $2000 as salary on Friday"</li>
              ) : null}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTransactionDialog;
