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
import {
  entryTotalCost,
  formatMoney,
  formatWholeDollars,
  parseBillingYearMonth,
} from "@/lib/utils";
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

function weightedUnitCost(cost: number, usage: number): number | null {
  if (usage <= 0 || !Number.isFinite(cost) || !Number.isFinite(usage)) {
    return null;
  }
  return cost / usage;
}

export function UnitCostChart({
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

  const { chartData, maxUnitCost } = useMemo(() => {
    const costByMonth = new Array(12).fill(0) as number[];
    const usageByMonth = new Array(12).fill(0) as number[];
    for (const entry of utilityEntries) {
      if (entry.utility !== resolvedUtilityId) continue;
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== year) continue;
      const i = p.month - 1;
      costByMonth[i] += entryTotalCost(entry);
      usageByMonth[i] += entry.usage;
    }
    const data = MONTH_SHORT.map((label, i) => {
      const u = weightedUnitCost(costByMonth[i], usageByMonth[i]);
      return {
        month: label,
        monthIndex: i + 1,
        unitCost: u,
        monthCost: costByMonth[i],
        monthUsage: usageByMonth[i],
      };
    });
    const max = data.reduce((m, d) => {
      const u = d.unitCost;
      if (u == null || !Number.isFinite(u)) return m;
      return Math.max(m, u);
    }, 0);
    return { chartData: data, maxUnitCost: max };
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
          <CardTitle className="text-base">Average unit cost by month</CardTitle>
          <CardDescription>
            Blended total cost ÷ usage per month in {year} for {typeLabel}{" "}
            (by billing period start).
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
        ) : maxUnitCost === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No unit cost data for {typeLabel} in {year}{" "}
            (needs usage &gt; 0 and a start date in that month).
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
                  tickFormatter={(v) => `$${formatMoney(Number(v))}`}
                  width={64}
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

                    const row = payload[0]?.payload as {
                      unitCost: number | null;
                      monthCost: number;
                      monthUsage: number;
                    };
                    const uc = row.unitCost;
                    if (uc == null || !Number.isFinite(uc)) return null;
                    return (
                      <div className="space-y-1">
                        <p className="font-medium text-popover-foreground">
                          {label} {year}
                        </p>
                        <p className="text-muted-foreground">
                          Avg unit cost:{" "}
                          <span className="text-popover-foreground">
                            ${formatMoney(uc)}/{usageUnitLabel}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Total cost:{" "}
                          <span className="text-popover-foreground">
                            {formatWholeDollars(row.monthCost)}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Usage:{" "}
                          <span className="text-popover-foreground">
                            {(Number.isFinite(row.monthUsage)
                              ? row.monthUsage
                              : 0
                            ).toLocaleString("en-US", {
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
                  dataKey="unitCost"
                  name={`${typeLabel} ($/${usageUnitLabel})`}
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
