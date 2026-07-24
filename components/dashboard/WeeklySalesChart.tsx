"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { formatMoney } from "@/lib/utils/money";

export function WeeklySalesChart({
  data,
}: {
  data: { date: string; dayLabel: string; sales: number; isToday: boolean }[];
}) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isToday ? "#8b1a1a" : "#f5c6c6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
