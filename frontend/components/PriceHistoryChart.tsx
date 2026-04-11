"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNGN } from "@/lib/api";

interface Point {
  store: string;
  price: number;
  scraped_at: string;
}

interface Props {
  data: Point[];
}

const STORE_COLORS: Record<string, string> = {
  Jumia: "#ff720a",
  Konga: "#0066cc",
  Kara: "#22c55e",
};

function getColor(store: string, idx: number): string {
  return STORE_COLORS[store] || ["#a855f7", "#ec4899", "#14b8a6"][idx % 3];
}

export default function PriceHistoryChart({ data }: Props) {
  // Pivot data: [{date, Jumia: price, Konga: price, ...}]
  const storeNames = [...new Set(data.map((d) => d.store))];

  const byDate: Record<string, Record<string, number>> = {};
  for (const point of data) {
    const date = point.scraped_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = {};
    byDate[date][point.store] = point.price;
  }

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, prices]) => ({ date, ...prices }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-panel border border-border rounded-lg p-3 text-xs shadow-xl">
        <p className="text-muted mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.dataKey}: {formatNGN(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-panel border border-border rounded-xl p-5">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b6b6b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#6b6b6b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#6b6b6b" }}
          />
          {storeNames.map((store, idx) => (
            <Line
              key={store}
              type="monotone"
              dataKey={store}
              stroke={getColor(store, idx)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
