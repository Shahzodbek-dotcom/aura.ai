"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Sparkles, Target, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/providers/language-provider";
import {
  contributeToGoal,
  createGoal,
  DashboardSummary,
  deleteGoal,
  deleteTransaction,
  getCurrentUser,
  getDashboardSummary,
  GoalProgress,
  parseExpense,
  Transaction,
  updateGoal,
  updateTransaction,
} from "@/lib/api";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { ExpenseParserForm } from "@/components/dashboard/expense-parser-form";
import { GoalForm } from "@/components/dashboard/goal-form";
import { SpendingTrendChart } from "@/components/dashboard/spending-trend-chart";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  clearStoredSession,
  getStoredAccessToken,
  persistSession,
} from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";

function formatCurrency(value: number, language: string) {
  const locale = language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

function EmptyChartState({ title }: { title: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-dashed border-border bg-white/50 text-sm text-muted">
      {title}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    title: "",
    category: "",
    amount: "",
    transaction_date: "",
    notes: "",
  });
  const [goalForm, setGoalForm] = useState({
    title: "",
    target_amount: "",
    current_amount: "",
  });
  const [isPending, startTransition] = useTransition();

  function beginEditing(transaction: Transaction) {
    setEditingTransactionId(transaction.id);
    setTransactionForm({
      title: transaction.title,
      category: transaction.category,
      amount: String(transaction.amount),
      transaction_date: transaction.transaction_date.slice(0, 16),
      notes: transaction.notes ?? "",
    });
  }

  function beginGoalEditing(goal: GoalProgress) {
    setEditingGoalId(goal.id);
    setGoalForm({
      title: goal.title,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
    });
  }

  async function loadSummary() {
    try {
      const response = await getDashboardSummary();
      setSummary(response);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : t("dashboardLoadError");
      setError(message);
      if (message.includes("Sessiya topilmadi")) {
        clearStoredSession();
        router.replace("/login");
      }
    }
  }

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    void getCurrentUser()
      .then((validatedUser) => {
        persistSession(token, validatedUser);
        setUser(validatedUser);
        startTransition(() => {
          void loadSummary();
        });
      })
      .catch(() => {
        clearStoredSession();
        router.replace("/login");
      });
  }, [router]);

  async function handleExpenseSubmit(message: string) {
    setError(null);
    try {
      await parseExpense(message);
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("expenseSubmit");
      setError(message);
      toast.error(message);
    }
  }

  async function handleGoalSubmit(payload: {
    title: string;
    description?: string;
    target_amount: number;
    current_amount?: number;
  }) {
    setError(null);
    try {
      await createGoal(payload);
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("goalSubmit");
      setError(message);
      toast.error(message);
    }
  }

  async function handleGoalContribution(goalId: number, amount: number) {
    setError(null);
    try {
      await contributeToGoal(goalId, amount);
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("contributeSubmit");
      setError(message);
      toast.error(message);
    }
  }

  async function handleGoalSave(goalId: number) {
    setError(null);
    try {
      await updateGoal(goalId, {
        title: goalForm.title,
        target_amount: Number(goalForm.target_amount),
        current_amount: Number(goalForm.current_amount),
      });
      toast.success(t("goalUpdateSuccess"));
      setEditingGoalId(null);
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("goalUpdateError");
      setError(message);
      toast.error(message);
    }
  }

  async function handleGoalDelete(goalId: number) {
    setError(null);
    try {
      await deleteGoal(goalId);
      toast.success(t("goalDeleteSuccess"));
      if (editingGoalId === goalId) {
        setEditingGoalId(null);
      }
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("goalDeleteError");
      setError(message);
      toast.error(message);
    }
  }

  async function handleTransactionSave(transactionId: number) {
    setError(null);
    try {
      await updateTransaction(transactionId, {
        title: transactionForm.title,
        category: transactionForm.category,
        amount: Number(transactionForm.amount),
        transaction_date: transactionForm.transaction_date || undefined,
        notes: transactionForm.notes || undefined,
      });
      toast.success(t("updateSuccess"));
      setEditingTransactionId(null);
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("transactionUpdateError");
      setError(message);
      toast.error(message);
    }
  }

  async function handleTransactionDelete(transactionId: number) {
    setError(null);
    try {
      await deleteTransaction(transactionId);
      toast.success(t("deleteSuccess"));
      if (editingTransactionId === transactionId) {
        setEditingTransactionId(null);
      }
      await loadSummary();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("transactionDeleteError");
      setError(message);
      toast.error(message);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[36px] border border-border/70 bg-gradient-to-br from-secondary/55 via-card to-background p-6 shadow-soft sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-muted">{t("dashboardTitle")}</p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
                {t("dashboardGreeting", {
                  name: user?.full_name ?? t("dashboardGreetingFallback"),
                })}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                {t("dashboardSubtitle")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() =>
                  startTransition(() => {
                    void loadSummary();
                  })
                }
              >
                {t("refresh")}
              </Button>
              <Button
                onClick={() => {
                  clearStoredSession();
                  router.push("/login");
                }}
              >
                {t("logout")}
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-foreground">
            {error}
          </div>
        ) : null}

        <section className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-r from-primary to-accent p-[1px]">
          <div className="rounded-[31px] bg-background/92 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("insight")}</p>
                  <h2 className="mt-2 text-2xl font-display">
                    {summary?.latest_insight.title ?? t("insightLoading")}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                    {summary?.latest_insight.content ?? t("insightBody")}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted">
                {summary?.latest_insight.advice_type ?? "planning"} insight
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/85">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary/60 p-3">
                  <Wallet className="h-5 w-5 text-primary" />
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-muted">
                  {t("totalSpent")}
                </span>
              </div>
              <p className="font-display text-4xl">
                {formatCurrency(summary?.total_spent ?? 0, language)}
              </p>
              <p className="text-sm text-muted">{t("totalSpentBody")}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary/60 p-3">
                  <ArrowUpRight className="h-5 w-5 text-accent" />
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-muted">
                  {t("thisMonth")}
                </span>
              </div>
              <p className="font-display text-4xl">
                {formatCurrency(summary?.monthly_spent ?? 0, language)}
              </p>
              <p className="text-sm text-muted">{t("thisMonthBody")}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary/60 p-3">
                  <Target className="h-5 w-5 text-primary" />
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-muted">
                  {t("activeGoals")}
                </span>
              </div>
              <p className="font-display text-4xl">{summary?.goals.length ?? 0}</p>
              <p className="text-sm text-muted">{t("activeGoalsBody")}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("expenseParser")}</p>
                <h2 className="mt-2 text-2xl font-display">{t("expenseParserTitle")}</h2>
              </div>
              <ExpenseParserForm onSubmit={handleExpenseSubmit} />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("aiVisibility")}</p>
                  <h2 className="mt-1 text-xl font-semibold">{t("aiVisibilityTitle")}</h2>
                </div>
              </div>
              <p className="text-sm leading-7 text-muted">
                {t("aiVisibilityBody")}
              </p>
              <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">{t("currentSignal")}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {summary?.latest_insight.title ?? t("insightLoading")}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {summary?.latest_insight.content ?? t("aiCollecting")}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardContent>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("spendingTrend")}</p>
                  <h2 className="mt-2 text-2xl font-display">{t("spendingTrendTitle")}</h2>
                </div>
              </div>
              {summary?.spending_trend.length ? (
                <SpendingTrendChart data={summary.spending_trend} />
              ) : (
                <EmptyChartState title={t("spendingTrendEmpty")} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-5">
                <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("categoryMix")}</p>
                <h2 className="mt-2 text-2xl font-display">{t("categoryMixTitle")}</h2>
              </div>
              {summary?.category_breakdown.length ? (
                <CategoryBreakdownChart data={summary.category_breakdown} />
              ) : (
                <EmptyChartState title={t("categoryMixEmpty")} />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="bg-card/85">
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("newGoal")}</p>
                <h2 className="mt-2 text-2xl font-display">{t("newGoalTitle")}</h2>
              </div>
              <GoalForm
                goals={summary?.goals ?? []}
                onCreate={handleGoalSubmit}
                onContribute={handleGoalContribution}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("goalTracker")}</p>
                <h2 className="mt-2 text-2xl font-display">{t("goalTrackerTitle")}</h2>
              </div>

              <div className="space-y-4">
                {summary?.goals.length ? (
                  summary.goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-[24px] border border-border/80 bg-background/65 p-4"
                    >
                      {editingGoalId === goal.id ? (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1 sm:col-span-2">
                              <Label htmlFor={`goal-title-${goal.id}`}>{t("transactionTitle")}</Label>
                              <Input
                                id={`goal-title-${goal.id}`}
                                value={goalForm.title}
                                onChange={(event) =>
                                  setGoalForm((current) => ({ ...current, title: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`goal-target-${goal.id}`}>{t("goalTargetPlaceholder")}</Label>
                              <Input
                                id={`goal-target-${goal.id}`}
                                type="number"
                                value={goalForm.target_amount}
                                onChange={(event) =>
                                  setGoalForm((current) => ({
                                    ...current,
                                    target_amount: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`goal-current-${goal.id}`}>{t("goalCurrentPlaceholder")}</Label>
                              <Input
                                id={`goal-current-${goal.id}`}
                                type="number"
                                value={goalForm.current_amount}
                                onChange={(event) =>
                                  setGoalForm((current) => ({
                                    ...current,
                                    current_amount: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" onClick={() => void handleGoalSave(goal.id)}>
                              {t("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingGoalId(null)}
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">{goal.title}</h3>
                              <p className="mt-1 text-sm text-muted">
                                {t("goalRemaining", {
                                  amount: formatCurrency(goal.remaining_amount, language),
                                })}
                              </p>
                            </div>
                            <div className="rounded-full bg-secondary/50 px-3 py-1 text-sm font-medium text-foreground/80">
                              {Math.round(goal.progress_percentage)}%
                            </div>
                          </div>
                          <Progress className="mt-4" value={goal.progress_percentage} />
                          <div className="mt-3 flex justify-between text-sm text-muted">
                            <span>{t("saved", { amount: formatCurrency(goal.current_amount, language) })}</span>
                            <span>{t("target", { amount: formatCurrency(goal.target_amount, language) })}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => beginGoalEditing(goal)}
                            >
                              {t("edit")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => void handleGoalDelete(goal.id)}
                            >
                              {t("delete")}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border bg-white/60 p-6 text-sm text-muted">
                    {t("noGoals")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-card/85">
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("recentActivity")}</p>
                <h2 className="mt-2 text-2xl font-display">{t("recentActivityTitle")}</h2>
              </div>

              <div className="space-y-3">
                {summary?.recent_transactions.length ? (
                  summary.recent_transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-[22px] border border-border/70 bg-background/65 px-4 py-3"
                    >
                      {editingTransactionId === transaction.id ? (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor={`title-${transaction.id}`}>{t("transactionTitle")}</Label>
                              <Input
                                id={`title-${transaction.id}`}
                                value={transactionForm.title}
                                onChange={(event) =>
                                  setTransactionForm((current) => ({ ...current, title: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`category-${transaction.id}`}>{t("transactionCategory")}</Label>
                              <Input
                                id={`category-${transaction.id}`}
                                value={transactionForm.category}
                                onChange={(event) =>
                                  setTransactionForm((current) => ({ ...current, category: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`amount-${transaction.id}`}>{t("transactionAmount")}</Label>
                              <Input
                                id={`amount-${transaction.id}`}
                                type="number"
                                value={transactionForm.amount}
                                onChange={(event) =>
                                  setTransactionForm((current) => ({ ...current, amount: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`date-${transaction.id}`}>{t("transactionDate")}</Label>
                              <Input
                                id={`date-${transaction.id}`}
                                type="datetime-local"
                                value={transactionForm.transaction_date}
                                onChange={(event) =>
                                  setTransactionForm((current) => ({
                                    ...current,
                                    transaction_date: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`notes-${transaction.id}`}>{t("transactionNotes")}</Label>
                            <Textarea
                              id={`notes-${transaction.id}`}
                              value={transactionForm.notes}
                              onChange={(event) =>
                                setTransactionForm((current) => ({ ...current, notes: event.target.value }))
                              }
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" onClick={() => void handleTransactionSave(transaction.id)}>
                              {t("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingTransactionId(null)}
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">{transaction.title}</p>
                            <p className="mt-1 text-sm capitalize text-muted">{transaction.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(transaction.amount, language)}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {new Date(transaction.transaction_date).toLocaleDateString(
                                language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US"
                              )}
                            </p>
                            <div className="mt-2 flex justify-end gap-2">
                              <Button
                                type="button"
                                size="default"
                                variant="outline"
                                onClick={() => beginEditing(transaction)}
                              >
                                {t("edit")}
                              </Button>
                              <Button
                                type="button"
                                size="default"
                                variant="ghost"
                                onClick={() => void handleTransactionDelete(transaction.id)}
                              >
                                {t("delete")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border bg-white/60 p-6 text-sm text-muted">
                    {t("noTransactions")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted">{t("session")}</p>
                <h2 className="mt-2 text-2xl font-display">{t("sessionTitle")}</h2>
              </div>

              <div className="rounded-[28px] border border-border/80 bg-background/65 p-5">
                <p className="text-sm text-muted">{t("name")}</p>
                <p className="mt-2 text-xl font-semibold">{user?.full_name ?? "-"}</p>
                <p className="mt-5 text-sm text-muted">{t("email")}</p>
                <p className="mt-2 text-base font-medium">{user?.email ?? "-"}</p>
                <p className="mt-5 text-sm text-muted">{t("status")}</p>
                <p className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {isPending ? t("refreshing") : t("workspace")}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
