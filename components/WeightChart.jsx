"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T } from "@/lib/nutrition";

export default function WeightChart({ data, dark }) {
  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? T.borderDark : T.borderLight} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: dark ? T.subDark : T.subLight }} />
          <YAxis tick={{ fontSize: 11, fill: dark ? T.subDark : T.subLight }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip contentStyle={{ backgroundColor: dark ? T.cardDark : T.cardLight, border: `1px solid ${dark ? T.borderDark : T.borderLight}`, borderRadius: 12 }} />
          <Line type="monotone" dataKey="peso" stroke={T.ai1} strokeWidth={2.5} dot={{ r: 3, fill: T.ai1 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
