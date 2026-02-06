"use client";

import React from "react"

import { useState, useEffect, useCallback } from "react";
import {
  HandCoins,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import type { User, Bond } from "@/lib/community-store";

interface BondsTabProps {
  currentUser: User;
  onRefreshUsers: () => void;
}

export function BondsTab({ currentUser, onRefreshUsers }: BondsTabProps) {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formRate, setFormRate] = useState("3");
  const [formDuration, setFormDuration] = useState("90");
  const [formPurpose, setFormPurpose] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBonds = useCallback(async () => {
    try {
      const res = await fetch("/api/community/bonds");
      const data = await res.json();
      setBonds(data.bonds || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchBonds();
  }, [fetchBonds]);

  const createBond = async () => {
    if (!formAmount || Number(formAmount) <= 0) return;
    setLoading(true);
    try {
      await fetch("/api/community/bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          borrowerId: currentUser.id,
          borrowerName: currentUser.name,
          amount: Number(formAmount),
          interestRate: Number(formRate),
          durationDays: Number(formDuration),
          purpose: formPurpose,
        }),
      });
      setFormAmount("");
      setFormRate("3");
      setFormDuration("90");
      setFormPurpose("");
      setShowCreate(false);
      await fetchBonds();
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const fundBondAction = async (bondId: string) => {
    setActionLoading(bondId);
    try {
      await fetch("/api/community/bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fund",
          bondId,
          lenderId: currentUser.id,
          lenderName: currentUser.name,
        }),
      });
      await fetchBonds();
      onRefreshUsers();
    } catch {
      // Ignore
    } finally {
      setActionLoading(null);
    }
  };

  const repayBondAction = async (bondId: string) => {
    setActionLoading(bondId);
    try {
      await fetch("/api/community/bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "repay",
          bondId,
        }),
      });
      await fetchBonds();
      onRefreshUsers();
    } catch {
      // Ignore
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    open: "bg-chart-3/20 text-chart-3",
    funded: "bg-primary/20 text-primary",
    repaid: "bg-chart-4/20 text-chart-4",
    defaulted: "bg-destructive/20 text-destructive",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    open: <Clock className="h-3 w-3" />,
    funded: <HandCoins className="h-3 w-3" />,
    repaid: <CheckCircle2 className="h-3 w-3" />,
    defaulted: <AlertCircle className="h-3 w-3" />,
  };

  return (
    <div className="space-y-4 p-4" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Community Bonds</h3>
          <p className="text-[11px] text-muted-foreground">
            Lend or borrow from fellow farmers at fair rates
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20"
        >
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreate ? "Cancel" : "Request Loan"}
        </button>
      </div>

      {/* Create Bond Form */}
      {showCreate && (
        <div className="glass rounded-2xl p-4">
          <h4 className="mb-3 text-xs font-semibold text-foreground">New Bond Request</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="bond-amount" className="mb-1 block text-[11px] text-muted-foreground">
                Amount (Rs.)
              </label>
              <input
                id="bond-amount"
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="5000"
                className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label htmlFor="bond-rate" className="mb-1 block text-[11px] text-muted-foreground">
                Interest Rate (%)
              </label>
              <input
                id="bond-rate"
                type="number"
                value={formRate}
                onChange={(e) => setFormRate(e.target.value)}
                className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label htmlFor="bond-duration" className="mb-1 block text-[11px] text-muted-foreground">
                Duration (days)
              </label>
              <select
                id="bond-duration"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="120">120 days</option>
                <option value="180">180 days</option>
              </select>
            </div>
            <div>
              <label htmlFor="bond-purpose" className="mb-1 block text-[11px] text-muted-foreground">
                Purpose
              </label>
              <input
                id="bond-purpose"
                type="text"
                value={formPurpose}
                onChange={(e) => setFormPurpose(e.target.value)}
                placeholder="Seeds, fertilizer, etc."
                className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={createBond}
            disabled={loading || !formAmount}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Bond Request"}
          </button>
        </div>
      )}

      {/* Bond List */}
      <div className="space-y-3">
        {bonds.map((bond) => {
          const canFund =
            bond.status === "open" &&
            bond.borrowerId !== currentUser.id;
          const canRepay =
            bond.status === "funded" &&
            bond.borrowerId === currentUser.id;
          const repayAmount = Math.round(bond.amount * (1 + bond.interestRate / 100));

          return (
            <div key={bond.id} className="glass rounded-xl p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Rs.{bond.amount.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      at {bond.interestRate}% for {bond.durationDays} days
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {bond.borrowerName}
                    {bond.lenderName && <span> | Funded by {bond.lenderName}</span>}
                  </p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[bond.status]}`}>
                  {statusIcons[bond.status]}
                  {bond.status}
                </span>
              </div>

              {bond.purpose && (
                <p className="mb-2 text-xs text-muted-foreground italic">
                  &quot;{bond.purpose}&quot;
                </p>
              )}

              {bond.dueDate && bond.status === "funded" && (
                <p className="mb-2 text-[10px] text-muted-foreground">
                  Due: {new Date(bond.dueDate).toLocaleDateString()} | Repay: Rs.{repayAmount.toLocaleString()}
                </p>
              )}

              <div className="flex gap-2">
                {canFund && (
                  <button
                    type="button"
                    onClick={() => fundBondAction(bond.id)}
                    disabled={actionLoading === bond.id}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-40"
                  >
                    {actionLoading === bond.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <HandCoins className="h-3 w-3" />
                    )}
                    Fund This Loan
                  </button>
                )}
                {canRepay && (
                  <button
                    type="button"
                    onClick={() => repayBondAction(bond.id)}
                    disabled={actionLoading === bond.id}
                    className="flex items-center gap-1.5 rounded-lg bg-chart-4/10 px-3 py-1.5 text-xs font-medium text-chart-4 transition-all hover:bg-chart-4/20 disabled:opacity-40"
                  >
                    {actionLoading === bond.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Repay Rs.{repayAmount.toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
