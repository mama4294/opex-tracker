"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { parseBillingYearMonth } from "@/lib/utils";
import { useStore } from "@/store/useStore";

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

function fillForBadgeColor(badgeColor: string): string {
  if (badgeColor === "primary") return "var(--primary)";
  if (badgeColor === "muted") return "var(--muted-foreground)";
  return `var(--${badgeColor})`;
}

function formatUsageAxis(v: number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  }
  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 2 })}k`;
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function ConsumptionChart({
  year,
  lockedUtilityId,
}: {
  year: number;
  lockedUtilityId?: string;
}) {
  const utilityEntries = useStore((s) => s.utilityEntries);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);

  const [utilityId, setUtilityId] = useState<string>("");

  const resolvedUtilityId = useMemo(
    () =>
      lockedUtilityId ?? (utilityId || utilityTypeDefinitions[0]?.id || ""),
    [lockedUtilityId, utilityId, utilityTypeDefinitions],
  );

  const selectedDef = utilityTypeDefinitions.find(
    (d) => d.id === resolvedUtilityId,
  );

  const { chartData, maxUsage } = useMemo(() => {
    const usageByMonth = new Array(12).fill(0) as number[];
    for (const entry of utilityEntries) {
      if (entry.utility !== resolvedUtilityId) continue;
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== year) continue;
      const i = p.month - 1;
      usageByMonth[i] += entry.usage;
    }
    const data = MONTH_SHORT.map((label, i) => {
      const u = usageByMonth[i];
      return {
        month: label,
        monthIndex: i + 1,
        usage: u,
      };
    });
    const max = data.reduce((m, d) => Math.max(m, d.usage), 0);
    return { chartData: data, maxUsage: max };
  }, [utilityEntries, resolvedUtilityId, year]);

  const barFill =
    selectedDef != null
      ? fillForBadgeColor(selectedDef.badgeColor)
      : "var(--chart-1)";

  const hasTypes = utilityTypeDefinitions.length > 0;
  const typeLabel = selectedDef?.label ?? "Expense type";
  const usageUnitLabel = selectedDef?.defaultUsageUnit ?? "units";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Consumption by month</CardTitle>
          <CardDescription>
            Total usage for {typeLabel} in {year} by billing period start
            month ({usageUnitLabel}).
          </CardDescription>
        </div>
        {!lockedUtilityId ? (
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
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {!hasTypes ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add expense types in Settings to use this chart.
          </p>
        ) : maxUsage === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {typeLabel} usage with a start date in {year}.
          </p>
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
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
                  tickFormatter={(v) => formatUsageAxis(Number(v))}
                  width={48}
                  domain={[0, (dataMax: number) => dataMax * 1.08 || 1]}
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
                    const row = payload[0]?.payload as { usage: number };
                    const u = Number.isFinite(row.usage) ? row.usage : 0;
                    return (
                      <div className="space-y-1">
                        <p className="font-medium text-popover-foreground">
                          {label} {year}
                        </p>
                        <p className="text-muted-foreground">
                          Usage:{" "}
                          <span className="text-popover-foreground">
                            {u.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {usageUnitLabel}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="usage"
                  name={`${typeLabel} (${usageUnitLabel})`}
                  fill={barFill}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
