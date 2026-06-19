"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { getReferralPipeline } from "@/lib/data";
import { STATUS_META } from "@/components/referrals/StatusBadge";

export function PipelineFunnel() {
  const { referrals } = useStore();
  const pipeline = getReferralPipeline("org", referrals);
  const data = pipeline.ordered.map((o) => ({
    name: STATUS_META[o.status].label,
    count: o.count,
    color: STATUS_META[o.status].color,
  }));

  return (
    <Card id="pipeline">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Referral pipeline</CardTitle>
        <span className="text-[11px] text-ink-faint">{pipeline.total} referrals across the org</span>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--ink-soft)", fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={26}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: "var(--ink)", fontSize: 12, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
