"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Plus,
  Trash2,
  VolumeX,
  Volume2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type Budget = {
  _id?: string;
  id?: string;
  userId: string;
  category: string;
  amount: number;
  spent: number;
  period: "monthly" | "weekly" | "yearly";
  alertThreshold: number;
  alertEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Transaction = {
  _id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
};

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: "",
    amount: "",
    period: "monthly" as const,
    alertThreshold: "80",
    alertEnabled: true,
  });
  const [audioEnabled, setAudioEnabled] = useState(true);

  const { toast } = useToast();

  // Track budgets that have already triggered alerts
  const [alertedBudgetIds, setAlertedBudgetIds] = useState<Set<string>>(
    new Set()
  );

  // Get user ID from localStorage
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

  // Fetch budgets and transactions when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserBudgets(userId);
      fetchUserTransactions(userId);
    }
  }, [userId]);

  // Calculate spent amounts when transactions or budgets change
  // Use a ref to prevent infinite loops
  const [shouldCalculateSpent, setShouldCalculateSpent] = useState(true);

  useEffect(() => {
    if (budgets.length > 0 && transactions.length > 0 && shouldCalculateSpent) {
      // Disable recalculation until the next data fetch
      setShouldCalculateSpent(false);
      calculateSpentAmounts();
    }
  }, [transactions, budgets, shouldCalculateSpent]);

  // Re-enable calculation when new data is fetched
  useEffect(() => {
    if (transactions.length > 0) {
      setShouldCalculateSpent(true);
    }
  }, [transactions.length]);

  // Check for budget alerts when budgets are updated
  useEffect(() => {
    if (budgets.length > 0) {
      checkBudgetAlerts();
    }
  }, [budgets, audioEnabled, alertedBudgetIds]);

  const fetchUserBudgets = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/budgets/user/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // No budgets found is not an error
          setBudgets([]);
          setLoading(false);
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch budgets");
      }

      const budgetsData = await response.json();
      setBudgets(budgetsData);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching budgets:", err);
      // Only set error for non-404 errors
      if (
        err.message !== "Failed to fetch budgets" ||
        !err.status ||
        err.status !== 404
      ) {
        setError(err.message || "Failed to load budget data");
      }
      setBudgets([]);
      setLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    try {
      const response = await fetch(`/api/transactions/user/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }

      const transactionsData = await response.json();
      setTransactions(transactionsData);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      toast({
        title: "Error",
        description: "Failed to load transaction data for budget calculations.",
        variant: "destructive",
      });
    }
  };

  const calculateSpentAmounts = () => {
    // Create a copy of budgets to update
    const updatedBudgets = [...budgets];
    let hasChanges = false;

    updatedBudgets.forEach((budget, index) => {
      let spent = 0;
      const currentDate = new Date();

      // Filter transactions by category
      const categoryTransactions = transactions.filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === budget.category
      );

      // Calculate date range based on budget period
      let startDate = new Date();
      if (budget.period === "weekly") {
        // Start of current week (Sunday)
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (budget.period === "monthly") {
        // Start of current month
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
      } else if (budget.period === "yearly") {
        // Start of current year
        startDate = new Date(currentDate.getFullYear(), 0, 1);
      }

      // Sum up transactions within the date range
      categoryTransactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= startDate && transactionDate <= currentDate) {
          spent += transaction.amount;
        }
      });

      // Only update if the spent amount has changed
      if (budget.spent !== spent) {
        // Update budget with calculated spent amount
        updatedBudgets[index] = {
          ...budget,
          spent,
        };
        hasChanges = true;
      }
    });

    // Only update state if there were actual changes
    if (hasChanges) {
      setBudgets(updatedBudgets);
    }
  };

  const checkBudgetAlerts = () => {
    if (!audioEnabled) return;

    const newAlertedIds = new Set(alertedBudgetIds);
    let hasNewAlerts = false;

    budgets.forEach((budget) => {
      if (!budget.alertEnabled) return;

      // Skip if we've already alerted for this budget in this session
      const budgetId = budget._id || budget.id;
      if (!budgetId || alertedBudgetIds.has(budgetId)) return;

      const percentUsed = (budget.spent / budget.amount) * 100;
      if (percentUsed >= budget.alertThreshold) {
        // Play alert sound
        const utterance = new SpeechSynthesisUtterance(
          `Alert: You've used ${Math.round(percentUsed)}% of your ${
            budget.category
          } budget.`
        );
        window.speechSynthesis.speak(utterance);

        // Show toast
        toast({
          title: `${budget.category} Budget Alert`,
          description: `You've used ${Math.round(
            percentUsed
          )}% of your budget.`,
          variant: "destructive",
        });

        // Mark this budget as alerted
        newAlertedIds.add(budgetId);
        hasNewAlerts = true;
      }
    });

    // Only update state if we have new alerts
    if (hasNewAlerts) {
      setAlertedBudgetIds(newAlertedIds);
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);

    if (!audioEnabled) {
      // Test the audio when enabling
      const utterance = new SpeechSynthesisUtterance(
        "Voice alerts are now enabled."
      );
      window.speechSynthesis.speak(utterance);
    } else {
      // Confirm audio is disabled
      toast({
        title: "Voice Alerts Disabled",
        description:
          "You will no longer receive voice alerts for budget limits.",
      });
    }
  };

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.amount) {
      toast({
        title: "Missing Information",
        description: "Please provide a category and amount.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to create a budget.",
        variant: "destructive",
      });
      return;
    }

    try {
      const budgetData = {
        userId,
        category: newBudget.category,
        amount: Number.parseFloat(newBudget.amount),
        spent: 0, // Will be calculated later
        period: newBudget.period,
        alertThreshold: Number.parseInt(newBudget.alertThreshold),
        alertEnabled: newBudget.alertEnabled,
      };

      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create budget");
      }

      const savedBudget = await response.json();

      // Add the new budget to the list
      setBudgets([...budgets, savedBudget]);

      // Reset form
      setNewBudget({
        category: "",
        amount: "",
        period: "monthly",
        alertThreshold: "80",
        alertEnabled: true,
      });

      setIsDialogOpen(false);

      toast({
        title: "Budget Added",
        description: `Added ${savedBudget.category} budget of $${parseFloat(
          savedBudget.amount
        ).toFixed(2)}`,
      });

      // Recalculate spent amounts
      fetchUserTransactions(userId);
    } catch (err: any) {
      console.error("Error adding budget:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add budget",
        variant: "destructive",
      });
    }
  };

  const handleEditBudget = async () => {
    if (!editingBudget) return;

    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to update a budget.",
        variant: "destructive",
      });
      return;
    }

    try {
      const budgetId = editingBudget._id || editingBudget.id;

      const updateData = {
        category: editingBudget.category,
        amount: editingBudget.amount,
        period: editingBudget.period,
        alertThreshold: editingBudget.alertThreshold,
        alertEnabled: editingBudget.alertEnabled,
      };

      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update budget");
      }

      const updatedBudget = await response.json();

      // Update the budgets list
      const updatedBudgets = budgets.map((budget) =>
        budget._id === budgetId || budget.id === budgetId
          ? { ...updatedBudget, spent: budget.spent }
          : budget
      );

      setBudgets(updatedBudgets);
      setEditingBudget(null);
      setIsDialogOpen(false);

      toast({
        title: "Budget Updated",
        description: `Updated ${updatedBudget.category} budget`,
      });

      // Refresh to get latest data
      fetchUserTransactions(userId);
    } catch (err: any) {
      console.error("Error updating budget:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update budget",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to delete a budget.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete budget");
      }

      // Remove the deleted budget from the list
      setBudgets(
        budgets.filter((budget) => budget._id !== id && budget.id !== id)
      );

      toast({
        title: "Budget Deleted",
        description: "The budget has been deleted.",
      });
    } catch (err: any) {
      console.error("Error deleting budget:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const categories = [
    "Groceries",
    "Transportation",
    "Entertainment",
    "Dining",
    "Utilities",
    "Shopping",
    "Healthcare",
    "Education",
    "Housing",
    "Personal",
    "Travel",
    "Other",
  ];

  const periods = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  const getProgressColor = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage < 50) return "bg-green-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (error && error !== "User not logged in") {
    return (
      <div className="space-y-6">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-600 font-medium">Error</p>
            </div>
            <p className="mt-2 text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === "User not logged in") {
    return (
      <div className="space-y-6">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              You must be logged in to manage budgets.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => (window.location.href = "/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            Set and manage your budget limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={toggleAudio} variant="outline" className="gap-2">
            {audioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            {audioEnabled ? "Voice Alerts On" : "Voice Alerts Off"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBudget ? "Edit Budget" : "Add New Budget"}
                </DialogTitle>
                <DialogDescription>
                  {editingBudget
                    ? "Edit the budget details below."
                    : "Fill in the details to add a new budget."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={
                      editingBudget
                        ? editingBudget.category
                        : newBudget.category
                    }
                    onValueChange={(value) =>
                      editingBudget
                        ? setEditingBudget({
                            ...editingBudget,
                            category: value,
                          })
                        : setNewBudget({ ...newBudget, category: value })
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
                      editingBudget ? editingBudget.amount : newBudget.amount
                    }
                    onChange={(e) =>
                      editingBudget
                        ? setEditingBudget({
                            ...editingBudget,
                            amount: Number.parseFloat(e.target.value),
                          })
                        : setNewBudget({ ...newBudget, amount: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="period" className="text-right">
                    Period
                  </Label>
                  <Select
                    value={
                      editingBudget ? editingBudget.period : newBudget.period
                    }
                    onValueChange={(value: "weekly" | "monthly" | "yearly") =>
                      editingBudget
                        ? setEditingBudget({ ...editingBudget, period: value })
                        : setNewBudget({ ...newBudget, period: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alertThreshold" className="text-right">
                    Alert at %
                  </Label>
                  <Input
                    id="alertThreshold"
                    type="number"
                    min="1"
                    max="100"
                    className="col-span-3"
                    value={
                      editingBudget
                        ? editingBudget.alertThreshold
                        : newBudget.alertThreshold
                    }
                    onChange={(e) =>
                      editingBudget
                        ? setEditingBudget({
                            ...editingBudget,
                            alertThreshold: Number.parseInt(e.target.value),
                          })
                        : setNewBudget({
                            ...newBudget,
                            alertThreshold: e.target.value,
                          })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alertEnabled" className="text-right">
                    Enable Alerts
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="alertEnabled"
                      checked={
                        editingBudget
                          ? editingBudget.alertEnabled
                          : newBudget.alertEnabled
                      }
                      onCheckedChange={(checked) =>
                        editingBudget
                          ? setEditingBudget({
                              ...editingBudget,
                              alertEnabled: checked,
                            })
                          : setNewBudget({
                              ...newBudget,
                              alertEnabled: checked,
                            })
                      }
                    />
                    <Label htmlFor="alertEnabled">
                      {editingBudget
                        ? editingBudget.alertEnabled
                          ? "Alerts enabled"
                          : "Alerts disabled"
                        : newBudget.alertEnabled
                        ? "Alerts enabled"
                        : "Alerts disabled"}
                    </Label>
                  </div>
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
                  onClick={editingBudget ? handleEditBudget : handleAddBudget}
                >
                  {editingBudget ? "Save Changes" : "Add Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p>Loading your budget data...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentUsed = (budget.spent / budget.amount) * 100;
            const isOverBudget = percentUsed > 100;
            const isNearLimit =
              percentUsed >= budget.alertThreshold && !isOverBudget;

            return (
              <Card
                key={budget._id || budget.id}
                className={`${
                  isOverBudget
                    ? "border-red-500"
                    : isNearLimit
                    ? "border-yellow-500"
                    : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{budget.category}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(budget)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteBudget(budget._id || budget.id || "")
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {budget.period.charAt(0).toUpperCase() +
                      budget.period.slice(1)}{" "}
                    budget
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      ${budget.spent.toFixed(2)} of ${budget.amount.toFixed(2)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isOverBudget
                          ? "text-red-500"
                          : isNearLimit
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {Math.min(Math.round(percentUsed), 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentUsed, 100)}
                    className={`h-2 ${getProgressColor(
                      budget.spent,
                      budget.amount
                    )}`}
                  />
                  {budget.alertEnabled && (
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Volume2 className="mr-1 h-3 w-3" />
                      Alert at {budget.alertThreshold}%
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    {isOverBudget
                      ? `Over budget by $${(
                          budget.spent - budget.amount
                        ).toFixed(2)}`
                      : `$${(budget.amount - budget.spent).toFixed(
                          2
                        )} remaining`}
                  </div>
                </CardFooter>
              </Card>
            );
          })}

          {budgets.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-center text-muted-foreground">
                  You haven't set up any budgets yet.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Budget
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
