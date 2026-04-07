"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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
            <linearGradient id="spendingFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#1f6f5f" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#1f6f5f" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(31,26,23,0.08)" strokeDasharray="4 4" vertical={false} />
          <XAxis axisLine={false} dataKey="date" tickLine={false} stroke="#74685c" />
          <YAxis axisLine={false} tickLine={false} stroke="#74685c" />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(222,211,196,1)",
              background: "rgba(255,250,243,0.96)",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#1f6f5f"
            strokeWidth={3}
            fill="url(#spendingFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
