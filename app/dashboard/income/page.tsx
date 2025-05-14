"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Mic, MicOff, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import VoiceTransactionDialog from "@/app/components/VoiceTransactionDialog";

type Income = {
  _id?: string;
  id?: string;
  amount: number;
  category: string;
  source: string;
  description: string;
  date: string;
  type: string;
};

// Declare SpeechRecognition
declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: "",
    source: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { toast } = useToast();

  // Get user ID from localStorage and fetch transactions
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserId(userData._id);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setError("Could not retrieve user information");
      }
    } else {
      setError("User not logged in");
      setLoading(false);
    }
  }, []);

  // Fetch user's income transactions when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserIncomes(userId);
    }
  }, [userId]);

  const fetchUserIncomes = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/user/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch income transactions"
        );
      }

      const transactions = await response.json();

      // Filter only income transactions
      const incomeTransactions = transactions.filter(
        (transaction: Income) => transaction.type === "income"
      );

      setIncomes(incomeTransactions);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching income transactions:", err);
      setError(err.message || "Failed to load income data");
      setLoading(false);

      toast({
        title: "Error",
        description: "Failed to load your income data. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Speech recognition setup
  useEffect(() => {
    let recognition: any = null;

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");

        setTranscript(transcript);

        // Try to parse income from speech
        parseIncomeFromSpeech(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setTranscript("");
    setIsListening(true);

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");

        setTranscript(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.stop();
    }
  };

  const parseIncomeFromSpeech = (text: string) => {
    // Simple parsing logic - can be enhanced with more sophisticated NLP
    const amountRegex = /\$?(\d+(\.\d{1,2})?)/;
    const sourceKeywords: Record<string, string[]> = {
      Salary: ["salary", "paycheck", "wage", "monthly pay"],
      Freelance: ["freelance", "contract", "gig", "project"],
      Investments: ["investment", "dividend", "interest", "stock", "bond"],
      Rental: ["rent", "rental", "property"],
      Business: ["business", "profit", "sale", "revenue"],
      Gift: ["gift", "present", "donation"],
    };

    // Extract amount
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      const amount = amountMatch[1];

      // Try to determine source
      let source = "Other";
      for (const [src, keywords] of Object.entries(sourceKeywords)) {
        if (keywords.some((keyword) => text.toLowerCase().includes(keyword))) {
          source = src;
          break;
        }
      }

      // Set the form values
      setNewIncome({
        ...newIncome,
        amount,
        source,
        description: text.replace(amountRegex, "").trim(),
      });

      // Open the dialog with pre-filled values
      setIsDialogOpen(true);
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.amount || !newIncome.source) {
      toast({
        title: "Missing Information",
        description: "Please provide an amount and source.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to add income.",
        variant: "destructive",
      });
      return;
    }

    try {
      const incomeData = {
        type: "income",
        amount: Number.parseFloat(newIncome.amount),
        category: newIncome.source, // Using "source" as the category for income
        source: newIncome.source,
        description: newIncome.description,
        date: newIncome.date,
        userId: userId,
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add income");
      }

      const savedIncome = await response.json();

      // Add the new income to the list
      setIncomes([savedIncome, ...incomes]);

      // Reset form
      setNewIncome({
        amount: "",
        source: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      setIsDialogOpen(false);

      toast({
        title: "Income Added",
        description: `Added ${savedIncome.source} income of $${parseFloat(
          savedIncome.amount
        ).toFixed(2)}`,
      });
    } catch (err: any) {
      console.error("Error adding income:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add income",
        variant: "destructive",
      });
    }
  };

  const handleEditIncome = async () => {
    if (!editingIncome) return;
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to update income.",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionId = editingIncome._id || editingIncome.id;

      const updateData = {
        amount: editingIncome.amount,
        category: editingIncome.source,
        source: editingIncome.source,
        description: editingIncome.description,
        date: editingIncome.date,
      };

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update income");
      }

      const updatedIncome = await response.json();

      // Update the incomes list
      const updatedIncomes = incomes.map((income) =>
        income._id === transactionId || income.id === transactionId
          ? updatedIncome
          : income
      );

      setIncomes(updatedIncomes);
      setEditingIncome(null);
      setIsDialogOpen(false);

      toast({
        title: "Income Updated",
        description: `Updated ${updatedIncome.source} income`,
      });
    } catch (err: any) {
      console.error("Error updating income:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update income",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to delete income.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete income");
      }

      // Remove the deleted income from the list
      setIncomes(
        incomes.filter((income) => income._id !== id && income.id !== id)
      );

      toast({
        title: "Income Deleted",
        description: "The income entry has been deleted.",
      });
    } catch (err: any) {
      console.error("Error deleting income:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete income",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (income: Income) => {
    setEditingIncome(income);
    setIsDialogOpen(true);
  };

  const sources = [
    "Salary",
    "Freelance",
    "Investments",
    "Rental",
    "Business",
    "Gift",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">
            Manage your income sources and track your earnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
          >
            {isListening ? (
              <MicOff className="mr-2 h-4 w-4" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {isListening ? "Stop Recording" : "Add via Speech"}
          </Button>
          <VoiceTransactionDialog
            buttonText="Add via Speech"
            transactionType="income"
            onTransactionCreated={() => fetchUserIncomes(userId!)}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Income</DialogTitle>
                <DialogDescription>
                  Enter the details of your income.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newIncome.amount}
                    onChange={(e) =>
                      setNewIncome({ ...newIncome, amount: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="100.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">
                    Source
                  </Label>
                  <Input
                    id="source"
                    value={newIncome.source}
                    onChange={(e) =>
                      setNewIncome({ ...newIncome, source: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Salary, Freelance, etc."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={newIncome.description}
                    onChange={(e) =>
                      setNewIncome({
                        ...newIncome,
                        description: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder="Monthly salary, Project payment, etc."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newIncome.date}
                    onChange={(e) =>
                      setNewIncome({ ...newIncome, date: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddIncome}>
                  Add Income
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isListening && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <p className="font-medium">Listening...</p>
            </div>
            <p className="mt-2 text-muted-foreground">
              {transcript ||
                "Say something like 'Received $850 from freelance project'"}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => (window.location.href = "/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income History</CardTitle>
          <CardDescription>
            You have {incomes.length} recorded income entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Loading your income data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No income recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  incomes.map((income) => (
                    <TableRow key={income._id || income.id}>
                      <TableCell>
                        {new Date(income.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{income.source || income.category}</TableCell>
                      <TableCell>{income.description}</TableCell>
                      <TableCell className="text-right font-medium text-green-500">
                        ${parseFloat(income.amount.toString()).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(income)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteIncome(income._id || income.id || "")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
