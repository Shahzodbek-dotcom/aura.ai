"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import type { GoalProgress } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GoalFormProps = {
  goals: GoalProgress[];
  onCreate: (payload: {
    title: string;
    description?: string;
    target_amount: number;
    current_amount?: number;
  }) => Promise<void>;
  onContribute: (goalId: number, amount: number) => Promise<void>;
};

export function GoalForm({ goals, onCreate, onContribute }: GoalFormProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"create" | "contribute">("create");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        if (!title.trim() || !targetAmount.trim()) {
          toast.error(t("goalRequired"));
          return;
        }

        if (Number(targetAmount) <= 0) {
          toast.error(t("goalTargetPositive"));
          return;
        }

        if (currentAmount && Number(currentAmount) < 0) {
          toast.error(t("goalCurrentPositive"));
          return;
        }

        await onCreate({
          title,
          target_amount: Number(targetAmount),
          current_amount: currentAmount ? Number(currentAmount) : 0,
        });
        toast.success(t("goalSuccess"));
        setTitle("");
        setTargetAmount("");
        setCurrentAmount("");
      } else {
        if (!selectedGoalId) {
          toast.error(t("goalSelectRequired"));
          return;
        }
        if (!currentAmount.trim() || Number(currentAmount) <= 0) {
          toast.error(t("goalTargetPositive"));
          return;
        }

        await onContribute(Number(selectedGoalId), Number(currentAmount));
        toast.success(t("contributeSuccess"));
        setSelectedGoalId("");
        setCurrentAmount("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={mode === "create" ? "default" : "outline"} onClick={() => setMode("create")}>
          {t("createGoalMode")}
        </Button>
        <Button
          type="button"
          variant={mode === "contribute" ? "default" : "outline"}
          onClick={() => setMode("contribute")}
        >
          {t("contributeGoalMode")}
        </Button>
      </div>
      <p className="text-sm text-muted">{t("goalHint")}</p>

      {mode === "create" ? (
        <>
          <Input
            placeholder={t("goalPlaceholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              placeholder={t("goalTargetPlaceholder")}
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
            />
            <Input
              type="number"
              placeholder={t("goalCurrentPlaceholder")}
              value={currentAmount}
              onChange={(event) => setCurrentAmount(event.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <select
            className="h-11 rounded-[28px] border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            value={selectedGoalId}
            onChange={(event) => setSelectedGoalId(event.target.value)}
          >
            <option value="">{t("selectGoal")}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder={t("contributeAmount")}
            value={currentAmount}
            onChange={(event) => setCurrentAmount(event.target.value)}
          />
        </>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? t("goalSubmitting")
          : mode === "create"
            ? t("goalSubmit")
            : t("contributeSubmit")}
      </Button>
    </form>
  );
}
