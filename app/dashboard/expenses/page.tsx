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

type Expense = {
  _id?: string;
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "",
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

  // Fetch user's expense transactions when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserExpenses(userId);
    }
  }, [userId]);

  const fetchUserExpenses = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/user/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch expense transactions"
        );
      }

      const transactions = await response.json();

      // Filter only expense transactions
      const expenseTransactions = transactions.filter(
        (transaction: Expense) => transaction.type === "expense"
      );

      setExpenses(expenseTransactions);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching expense transactions:", err);
      setError(err.message || "Failed to load expense data");
      setLoading(false);

      toast({
        title: "Error",
        description:
          "Failed to load your expense data. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Speech recognition setup
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        setTranscript(transcript);

        // Try to parse expense from speech
        parseExpenseFromSpeech(transcript);
      };

      recognition.onerror = (event) => {
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
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
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
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.stop();
    }
  };

  const parseExpenseFromSpeech = (text: string) => {
    // Simple parsing logic - can be enhanced with more sophisticated NLP
    const amountRegex = /\$?(\d+(\.\d{1,2})?)/;
    const categoryKeywords: Record<string, string[]> = {
      Groceries: ["grocery", "groceries", "food", "supermarket"],
      Transportation: [
        "transport",
        "uber",
        "taxi",
        "bus",
        "train",
        "gas",
        "fuel",
      ],
      Entertainment: ["movie", "entertainment", "game", "concert"],
      Dining: ["restaurant", "dining", "lunch", "dinner", "breakfast"],
      Utilities: [
        "utility",
        "utilities",
        "bill",
        "electricity",
        "water",
        "internet",
      ],
      Shopping: ["shopping", "clothes", "purchase"],
    };

    // Extract amount
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      const amount = amountMatch[1];

      // Try to determine category
      let category = "Other";
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => text.toLowerCase().includes(keyword))) {
          category = cat;
          break;
        }
      }

      // Set the form values
      setNewExpense({
        ...newExpense,
        amount,
        category,
        description: text.replace(amountRegex, "").trim(),
      });

      // Open the dialog with pre-filled values
      setIsDialogOpen(true);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category) {
      toast({
        title: "Missing Information",
        description: "Please provide an amount and category.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to add an expense.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        type: "expense",
        amount: Number.parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        userId: userId,
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }

      const savedExpense = await response.json();

      // Add the new expense to the list
      setExpenses([savedExpense, ...expenses]);

      // Reset form
      setNewExpense({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      setIsDialogOpen(false);

      toast({
        title: "Expense Added",
        description: `Added ${savedExpense.category} expense of $${parseFloat(
          savedExpense.amount
        ).toFixed(2)}`,
      });
    } catch (err: any) {
      console.error("Error adding expense:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to update an expense.",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionId = editingExpense._id || editingExpense.id;

      const updateData = {
        amount: editingExpense.amount,
        category: editingExpense.category,
        description: editingExpense.description,
        date: editingExpense.date,
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
        throw new Error(errorData.error || "Failed to update expense");
      }

      const updatedExpense = await response.json();

      // Update the expenses list
      const updatedExpenses = expenses.map((expense) =>
        expense._id === transactionId || expense.id === transactionId
          ? updatedExpense
          : expense
      );

      setExpenses(updatedExpenses);
      setEditingExpense(null);
      setIsDialogOpen(false);

      toast({
        title: "Expense Updated",
        description: `Updated ${updatedExpense.category} expense`,
      });
    } catch (err: any) {
      console.error("Error updating expense:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to delete an expense.",
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
        throw new Error(errorData.error || "Failed to delete expense");
      }

      // Remove the deleted expense from the list
      setExpenses(
        expenses.filter((expense) => expense._id !== id && expense.id !== id)
      );

      toast({
        title: "Expense Deleted",
        description: "The expense has been deleted.",
      });
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const categories = [
    "Groceries",
    "Transportation",
    "Entertainment",
    "Dining",
    "Utilities",
    "Shopping",
    "Housing",
    "Healthcare",
    "Education",
    "Personal",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceTransactionDialog
            buttonText="Add via Speech"
            transactionType="expense"
            onTransactionCreated={() => fetchUserExpenses(userId!)}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense
                    ? "Edit the expense details below."
                    : "Fill in the details to add a new expense entry."}
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
                    step="0.01"
                    placeholder="0.00"
                    className="col-span-3"
                    value={
                      editingExpense ? editingExpense.amount : newExpense.amount
                    }
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({
                            ...editingExpense,
                            amount: Number.parseFloat(e.target.value),
                          })
                        : setNewExpense({
                            ...newExpense,
                            amount: e.target.value,
                          })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={
                      editingExpense
                        ? editingExpense.category
                        : newExpense.category
                    }
                    onValueChange={(value) =>
                      editingExpense
                        ? setEditingExpense({
                            ...editingExpense,
                            category: value,
                          })
                        : setNewExpense({ ...newExpense, category: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Description"
                    className="col-span-3"
                    value={
                      editingExpense
                        ? editingExpense.description
                        : newExpense.description
                    }
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({
                            ...editingExpense,
                            description: e.target.value,
                          })
                        : setNewExpense({
                            ...newExpense,
                            description: e.target.value,
                          })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    className="col-span-3"
                    value={
                      editingExpense ? editingExpense.date : newExpense.date
                    }
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({
                            ...editingExpense,
                            date: e.target.value,
                          })
                        : setNewExpense({ ...newExpense, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    editingExpense ? handleEditExpense : handleAddExpense
                  }
                >
                  {editingExpense ? "Save Changes" : "Add Expense"}
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
              {transcript || "Say something like 'Spent $45 on groceries'"}
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
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            You have {expenses.length} recorded expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <p>Loading your expense data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No expenses recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense._id || expense.id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right font-medium text-red-500">
                        ${parseFloat(expense.amount.toString()).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteExpense(
                                expense._id || expense.id || ""
                              )
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
