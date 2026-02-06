"use client";

import { useState } from "react";
import {
  Send,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { User } from "@/lib/community-store";

interface PaymentsTabProps {
  currentUser: User;
  users: User[];
  onRefreshUsers: () => void;
}

export function PaymentsTab({ currentUser, users, onRefreshUsers }: PaymentsTabProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const otherUsers = users.filter((u) => u.id !== currentUser.id);
  const currentBalance = users.find((u) => u.id === currentUser.id)?.balance ?? currentUser.balance;

  const handleSend = async () => {
    if (!selectedRecipient || !amount || Number(amount) <= 0) {
      setError("Please select a recipient and enter a valid amount");
      return;
    }
    if (Number(amount) > currentBalance) {
      setError("Insufficient balance");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/community/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: currentUser.id,
          toId: selectedRecipient,
          amount: Number(amount),
          note,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setAmount("");
        setNote("");
        setSelectedRecipient("");
        onRefreshUsers();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="space-y-6 p-4" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
      {/* Balance Card */}
      <div className="glass glow-green rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Balance</p>
            <p className="font-mono text-2xl font-bold text-foreground">
              Rs.{currentBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Send Money */}
      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Send Money</h3>

        {/* Recipient */}
        <div className="mb-4">
          <label htmlFor="recipient" className="mb-1.5 block text-xs text-muted-foreground">
            Select Recipient
          </label>
          <div className="flex flex-wrap gap-2">
            {otherUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedRecipient(user.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all ${
                  selectedRecipient === user.id
                    ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                    : "glass-subtle text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  {user.avatar}
                </span>
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-3">
          <label htmlFor="amount" className="mb-1.5 block text-xs text-muted-foreground">
            Amount (Rs.)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full rounded-lg bg-muted/50 px-3 py-2.5 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                type="button"
                onClick={() => setAmount(String(qa))}
                className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                Rs.{qa}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <label htmlFor="note" className="mb-1.5 block text-xs text-muted-foreground">
            Note (optional)
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., For fertilizer purchase"
            className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {error && (
          <p className="mb-3 text-xs text-destructive">{error}</p>
        )}

        {success && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Payment sent successfully!</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !selectedRecipient || !amount}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Payment
            </>
          )}
        </button>
      </div>

      {/* Recent members balances */}
      <div className="glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Community Members</h3>
        <div className="space-y-2.5">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    user.id === currentUser.id
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.avatar}
                </span>
                <div>
                  <p className="text-sm text-foreground">
                    {user.name}{" "}
                    {user.id === currentUser.id && (
                      <span className="text-xs text-primary">(You)</span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{user.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-foreground">
                  Rs.{user.balance.toLocaleString()}
                </span>
                {user.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient(user.id)}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
