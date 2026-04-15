"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import type { TransactionType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CashflowEntryFormProps = {
  onSubmit: (payload: {
    title: string;
    category: string;
    transaction_type: TransactionType;
    amount: number;
    transaction_date?: string;
    notes?: string;
  }) => Promise<void>;
};

const EXPENSE_CATEGORIES = ["food", "transport", "shopping", "bills", "health", "entertainment", "education", "general"];
const INCOME_CATEGORIES = ["salary", "freelance", "business", "bonus", "gift", "investment", "other"];

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  transport: "Transport",
  shopping: "Shopping",
  bills: "Bills",
  health: "Health",
  entertainment: "Entertainment",
  education: "Education",
  general: "General",
  salary: "Salary",
  freelance: "Freelance",
  business: "Business",
  bonus: "Bonus",
  gift: "Gift",
  investment: "Investment",
  other: "Other",
};

export function CashflowEntryForm({ onSubmit }: CashflowEntryFormProps) {
  const { t } = useLanguage();
  const [transactionType, setTransactionType] = useState<TransactionType>("income");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("salary");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(
    () => (transactionType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [transactionType]
  );

  function resetForm(nextType: TransactionType) {
    setTitle("");
    setAmount("");
    setTransactionDate("");
    setNotes("");
    setCategory(nextType === "income" ? "salary" : "general");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !category.trim() || !amount.trim()) {
      toast.error(t("cashflowRequired"));
      return;
    }

    if (Number(amount) <= 0) {
      toast.error(t("cashflowAmountPositive"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        transaction_type: transactionType,
        amount: Number(amount),
        transaction_date: transactionDate || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(
        transactionType === "income" ? t("incomeSuccess") : t("expenseSuccess")
      );
      resetForm(transactionType);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={transactionType === "income" ? "default" : "outline"}
          className={transactionType === "income" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          onClick={() => {
            setTransactionType("income");
            resetForm("income");
          }}
        >
          {t("incomeMode")}
        </Button>
        <Button
          type="button"
          variant={transactionType === "expense" ? "default" : "outline"}
          className={transactionType === "expense" ? "bg-rose-600 hover:bg-rose-700" : ""}
          onClick={() => {
            setTransactionType("expense");
            resetForm("expense");
          }}
        >
          {t("expenseMode")}
        </Button>
      </div>

      <p className="text-sm text-muted">
        {transactionType === "income" ? t("incomeHint") : t("manualExpenseHint")}
      </p>

      <Input
        placeholder={transactionType === "income" ? t("incomeTitlePlaceholder") : t("expenseTitlePlaceholder")}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="h-11 rounded-[28px] border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item] ?? item}
            </option>
          ))}
        </select>

        <Input
          type="number"
          placeholder={t("transactionAmount")}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <Input
        type="datetime-local"
        value={transactionDate}
        onChange={(event) => setTransactionDate(event.target.value)}
      />

      <Textarea
        placeholder={t("transactionNotes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className={transactionType === "income" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
      >
        {isSubmitting
          ? t("cashflowSubmitting")
          : transactionType === "income"
            ? t("incomeSubmit")
            : t("manualExpenseSubmit")}
      </Button>
    </form>
  );
}
