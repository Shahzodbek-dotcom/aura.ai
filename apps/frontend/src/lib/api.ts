import type { StoredUser } from "@/lib/auth";
import { clearStoredSession, getStoredAccessToken, persistSession } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type AuthPayload = {
  full_name?: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: StoredUser;
};

export type Transaction = {
  id: number;
  title: string;
  category: string;
  transaction_type: "expense" | "income";
  amount: number;
  transaction_date: string;
  notes?: string | null;
  created_at: string;
};

export type TransactionType = Transaction["transaction_type"];

export type TransactionCreatePayload = {
  title: string;
  category: string;
  transaction_type: TransactionType;
  amount: number;
  transaction_date?: string;
  notes?: string;
};

export type TransactionUpdatePayload = {
  title: string;
  category: string;
  transaction_type: TransactionType;
  amount: number;
  transaction_date?: string;
  notes?: string;
};

export type GoalProgress = {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  progress_percentage: number;
};

export type GoalUpdatePayload = {
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
};

export type TrendPoint = {
  date: string;
  income: number;
  expense: number;
  balance: number;
};

export type CategorySpend = {
  category: string;
  total: number;
};

export type Insight = {
  id?: number | null;
  title: string;
  content: string;
  advice_type: string;
  created_at?: string | null;
};

export type DashboardSummary = {
  total_income: number;
  total_expense: number;
  net_balance: number;
  monthly_income: number;
  monthly_expense: number;
  recent_transactions: Transaction[];
  spending_trend: TrendPoint[];
  category_breakdown: CategorySpend[];
  goals: GoalProgress[];
  latest_insight: Insight;
};

export type AdminUserRow = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_admin?: boolean;
  created_at: string;
  transaction_count: number;
  total_spent: number;
  total_income: number;
  goal_count: number;
  total_goal_target: number;
};

export type AdminOverview = {
  total_users: number;
  total_transactions: number;
  total_goals: number;
  total_spent: number;
  total_income: number;
  users: AdminUserRow[];
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

function getAccessToken() {
  return getStoredAccessToken();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("Sessiya topilmadi. Qayta login qiling.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error("Server bilan bog'lanib bo'lmadi. Internet yoki backend holatini tekshiring.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { detail: "Server kutilmagan javob qaytardi" };

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearStoredSession();
    }
    throw new Error(data.detail ?? "So'rov bajarilmadi");
  }

  return data as T;
}

export async function login(payload: AuthPayload) {
  const response = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
  persistSession(response.access_token, response.user);
  return response;
}

export async function signup(payload: AuthPayload) {
  const response = await request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: payload,
  });
  persistSession(response.access_token, response.user);
  return response;
}

export async function parseExpense(message: string) {
  const response = await request<{ transactions: Transaction[]; parser: string }>(
    "/transactions/parse-expense",
    {
      method: "POST",
      body: { message },
      auth: true,
    }
  );

  return {
    ...response,
    transactions: response.transactions.map((transaction) => ({
      ...transaction,
      amount: toNumber(transaction.amount),
    })),
  };
}

export async function createGoal(payload: {
  title: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
}) {
  return request("/goals", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export async function createTransaction(payload: TransactionCreatePayload) {
  const response = await request<Transaction>("/transactions", {
    method: "POST",
    body: payload,
    auth: true,
  });

  return {
    ...response,
    amount: toNumber(response.amount),
  };
}

export async function contributeToGoal(goalId: number, amount: number) {
  return request(`/goals/${goalId}/contribute`, {
    method: "POST",
    body: { amount },
    auth: true,
  });
}

export async function updateGoal(goalId: number, payload: GoalUpdatePayload) {
  return request(`/goals/${goalId}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function deleteGoal(goalId: number) {
  await request(`/goals/${goalId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function updateTransaction(transactionId: number, payload: TransactionUpdatePayload) {
  const response = await request<Transaction>(`/transactions/${transactionId}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });

  return {
    ...response,
    amount: toNumber(response.amount),
  };
}

export async function deleteTransaction(transactionId: number) {
  await request(`/transactions/${transactionId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getDashboardSummary() {
  const response = await request<DashboardSummary>("/dashboard/summary", { auth: true });

  return {
    ...response,
    total_income: toNumber(response.total_income),
    total_expense: toNumber(response.total_expense),
    net_balance: toNumber(response.net_balance),
    monthly_income: toNumber(response.monthly_income),
    monthly_expense: toNumber(response.monthly_expense),
    recent_transactions: response.recent_transactions.map((item) => ({
      ...item,
      amount: toNumber(item.amount),
    })),
    spending_trend: response.spending_trend.map((item) => ({
      ...item,
      income: toNumber(item.income),
      expense: toNumber(item.expense),
      balance: toNumber(item.balance),
    })),
    category_breakdown: response.category_breakdown.map((item) => ({
      ...item,
      total: toNumber(item.total),
    })),
    goals: response.goals.map((goal) => ({
      ...goal,
      target_amount: toNumber(goal.target_amount),
      current_amount: toNumber(goal.current_amount),
      remaining_amount: toNumber(goal.remaining_amount),
    })),
  };
}

export async function getCurrentUser() {
  return request<StoredUser>("/auth/me", { auth: true });
}

export async function getAdminOverview() {
  const response = await request<AdminOverview>("/admin/overview", { auth: true });
  return {
    ...response,
    total_spent: toNumber(response.total_spent),
    users: response.users.map((user) => ({
      ...user,
      total_spent: toNumber(user.total_spent),
      total_income: toNumber(user.total_income),
      total_goal_target: toNumber(user.total_goal_target),
    })),
  };
}

export async function downloadAdminExport() {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Sessiya topilmadi. Qayta login qiling.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/export.xlsx`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Excel exportni yuklab bo'lmadi.");
  }

  return response.blob();
}
