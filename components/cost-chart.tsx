"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { UtilityEntry } from "@/types/utility";

function formatWholeDollars(n: number): string {
  const rounded = Math.round(Number.isFinite(n) ? n : 0);
  return `$${rounded.toLocaleString("en-US")}`;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseYmdParts(s: string): { year: number; month: number } | null {
  const [ys, ms] = s.trim().split("-");
  const year = Number(ys);
  const month = Number(ms);
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

function entryTotalCost(entry: UtilityEntry): number {
  return entry.costItems.reduce((sum, item) => sum + item.totalCost, 0);
}

/** SVG stroke color from theme tokens (matches utility badge color ids). */
function strokeForBadgeColor(badgeColor: string): string {
  if (badgeColor === "primary") return "var(--primary)";
  if (badgeColor === "muted") return "var(--muted-foreground)";
  return `var(--${badgeColor})`;
}

export function CostChart() {
  const utilityEntries = useStore((s) => s.utilityEntries);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);

  const [utilityId, setUtilityId] = useState<string>("");
  const [year, setYear] = useState(() => new Date().getFullYear());

  const resolvedUtilityId = useMemo(
    () => utilityId || utilityTypeDefinitions[0]?.id || "",
    [utilityId, utilityTypeDefinitions],
  );

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    for (const e of utilityEntries) {
      const p = parseYmdParts(e.dateStart);
      if (p) ys.add(p.year);
    }
    ys.add(new Date().getFullYear());
    return [...ys].sort((a, b) => b - a);
  }, [utilityEntries]);

  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.includes(year)) {
      setYear(yearOptions[0]);
    }
  }, [yearOptions, year]);

  const selectedDef = utilityTypeDefinitions.find(
    (d) => d.id === resolvedUtilityId,
  );

  const chartData = useMemo(() => {
    const costByMonth = new Array(12).fill(0) as number[];
    const usageByMonth = new Array(12).fill(0) as number[];
    for (const entry of utilityEntries) {
      if (entry.utility !== resolvedUtilityId) continue;
      const p = parseYmdParts(entry.dateStart);
      if (!p || p.year !== year) continue;
      const i = p.month - 1;
      costByMonth[i] += entryTotalCost(entry);
      usageByMonth[i] += entry.usage;
    }
    return MONTH_SHORT.map((label, i) => ({
      month: label,
      monthIndex: i + 1,
      cost: Math.round(costByMonth[i]),
      usage: usageByMonth[i],
    }));
  }, [utilityEntries, resolvedUtilityId, year]);

  const maxCost = useMemo(
    () => chartData.reduce((m, d) => Math.max(m, d.cost), 0),
    [chartData],
  );

  const stroke =
    selectedDef != null
      ? strokeForBadgeColor(selectedDef.badgeColor)
      : "var(--chart-1)";

  const hasTypes = utilityTypeDefinitions.length > 0;
  const typeLabel = selectedDef?.label ?? "Expense type";
  const usageUnitLabel = selectedDef?.defaultUsageUnit ?? "units";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Cost by month</CardTitle>
          <CardDescription>
            Total billed cost for one expense type in {year} (allocated to the
            billing period start month).
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Select
            value={resolvedUtilityId || undefined}
            onValueChange={setUtilityId}
            disabled={!hasTypes}
          >
            <SelectTrigger className="w-[200px]" size="sm" aria-label="Expense type">
              <SelectValue placeholder="Expense type" />
            </SelectTrigger>
            <SelectContent>
              {utilityTypeDefinitions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]" size="sm" aria-label="Year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!hasTypes ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add expense types in Settings to use this chart.
          </p>
        ) : maxCost === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {typeLabel} expenses with a start date in {year}.
          </p>
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.45}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatWholeDollars(Number(v))}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: "0.75rem",
                  }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as {
                      cost: number;
                      usage: number;
                    };
                    const cost = Number.isFinite(row.cost) ? row.cost : 0;
                    const usage = Number.isFinite(row.usage) ? row.usage : 0;
                    const usageText = usage.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    });
                    return (
                      <div className="space-y-1">
                        <p className="font-medium text-popover-foreground">
                          {label} {year}
                        </p>
                        <p className="text-muted-foreground">
                          {typeLabel}:{" "}
                          <span className="text-popover-foreground">
                            {formatWholeDollars(cost)}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Consumption:{" "}
                          <span className="text-popover-foreground">
                            {usageText} {usageUnitLabel}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name={typeLabel}
                  stroke={stroke}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
