"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CategorySpend } from "@/lib/api";

const COLORS = ["#22c59c", "#6ea8ff", "#ff7d5f", "#7a8cff", "#ffd166", "#8dd3c7"];

type CategoryBreakdownChartProps = {
  data: CategorySpend[];
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    general: "Boshqa",
    food: "Ovqat",
    transport: "Transport",
    shopping: "Shopping",
    bills: "To'lovlar",
    health: "Sog'liq",
    entertainment: "Ko'ngilochar",
    education: "Ta'lim",
  };
  return labels[category] ?? category;
}

export function CategoryBreakdownChart({
  data,
}: CategoryBreakdownChartProps) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={62}
              outerRadius={98}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.category}-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, getCategoryLabel(name)]}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(208,216,255,1)",
                background: "rgba(255,255,255,0.96)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const share = total > 0 ? (item.total / total) * 100 : 0;
          return (
            <div key={item.category} className="space-y-2 rounded-2xl bg-white/70 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-foreground">{getCategoryLabel(item.category)}</span>
                </div>
                <span className="font-semibold text-foreground">{item.total.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary/20">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${share}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
