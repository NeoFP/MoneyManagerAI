"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  DollarSign,
  PiggyBank,
  Wallet,
  ServerOff,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Transaction type definition
type Transaction = {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
  location?: string;
};

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<
    "unknown" | "online" | "offline"
  >("unknown");
  const [error, setError] = useState("");

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
          setError(
            "The backend server is offline. Please start it with 'npm run server' to run on port 5001."
          );
        }
      } catch (error) {
        console.error("Backend status check failed:", error);
        setBackendStatus("offline");
        setError(
          "The backend server is not running. Please start it with 'npm run server' to run on port 5001."
        );
      } finally {
        setLoading(false);
      }
    };

    checkBackendStatus();
  }, []);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Fetch transactions from API
  useEffect(() => {
    async function fetchTransactions() {
      if (backendStatus !== "online") {
        return;
      }

      try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();
        setTransactions(data);
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        setError(error.message || "Failed to load transactions");
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    }

    if (backendStatus === "online") {
      fetchTransactions();
    }
  }, [backendStatus]);

  // Get recent expenses and income
  const recentExpenses = transactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const recentIncome = transactions
    .filter((t) => t.type === "income")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  // If backend is offline, show a clear message
  if (backendStatus === "offline") {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <ServerOff className="h-4 w-4" />
          <AlertTitle>Backend Server Offline</AlertTitle>
          <AlertDescription>
            The backend server is not running. Please start it with 'npm run
            server' in your terminal to run on port 5001.
            <div className="mt-4">
              <pre className="bg-background p-4 rounded-md text-sm overflow-auto">
                cd {process.cwd().split("/").slice(0, -1).join("/")}
                <br />
                npm run server
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your finances.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions/voice">
            <Button>Add via Voice</Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button variant="outline">Manual Entry</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loading ? "Loading..." : balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current account balance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loading ? "Loading..." : totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loading ? "Loading..." : totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time income</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your most recent expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading transactions...</div>
            ) : recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{expense.category}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(expense.date)}
                      </div>
                    </div>
                    <div className="font-medium text-red-500">
                      -${expense.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/expenses">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    size="sm"
                  >
                    View all expenses
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No expenses yet
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Income</CardTitle>
            <CardDescription>Your most recent income</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading transactions...</div>
            ) : recentIncome.length > 0 ? (
              <div className="space-y-4">
                {recentIncome.map((income) => (
                  <div
                    key={income._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{income.category}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(income.date)}
                      </div>
                    </div>
                    <div className="font-medium text-green-500">
                      +${income.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/income">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    size="sm"
                  >
                    View all income
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No income yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
