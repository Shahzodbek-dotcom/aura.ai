"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TrendPoint } from "@/lib/api";

type SpendingTrendChartProps = {
  data: TrendPoint[];
};

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(31,26,23,0.08)" strokeDasharray="4 4" vertical={false} />
          <XAxis axisLine={false} dataKey="date" tickLine={false} stroke="#74685c" />
          <YAxis axisLine={false} tickLine={false} stroke="#74685c" />
          <Legend />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(222,211,196,1)",
              background: "rgba(255,250,243,0.96)",
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#16a34a"
            strokeWidth={3}
            fill="url(#incomeFill)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#dc2626"
            strokeWidth={3}
            fill="url(#expenseFill)"
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#1d4ed8"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
