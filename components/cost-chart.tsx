"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
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
import {
  entryTotalCost,
  formatWholeDollars,
  parseBillingYearMonth,
} from "@/lib/utils";
import { useStore } from "@/store/useStore";

/** Select value: one line per expense type (not a real utility id). */
const CHART_ALL_EXPENSES = "__all_expenses__";

const USAGE_FIELD_PREFIX = "__u_";

function usageFieldKey(utilityId: string): string {
  return `${USAGE_FIELD_PREFIX}${utilityId}`;
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

/** SVG stroke color from theme tokens (matches utility badge color ids). */
function strokeForBadgeColor(badgeColor: string): string {
  if (badgeColor === "primary") return "var(--primary)";
  if (badgeColor === "muted") return "var(--muted-foreground)";
  return `var(--${badgeColor})`;
}

export function CostChart({
  year,
  lockedUtilityId,
}: {
  year: number;
  /** When set, chart shows only this expense type and hides the type selector. */
  lockedUtilityId?: string;
}) {
  const utilityEntries = useStore((s) => s.utilityEntries);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);

  const [utilityId, setUtilityId] = useState<string>(CHART_ALL_EXPENSES);

  const showAllTypes =
    lockedUtilityId == null && utilityId === CHART_ALL_EXPENSES;
  const effectiveUtilityId = lockedUtilityId ?? utilityId;

  const selectedDef = utilityTypeDefinitions.find(
    (d) => d.id === effectiveUtilityId,
  );

  const { chartData, maxCost } = useMemo(() => {
    if (!showAllTypes) {
      const costByMonth = new Array(12).fill(0) as number[];
      const usageByMonth = new Array(12).fill(0) as number[];
      for (const entry of utilityEntries) {
        if (entry.utility !== effectiveUtilityId) continue;
        const p = parseBillingYearMonth(entry.dateStart);
        if (!p || p.year !== year) continue;
        const i = p.month - 1;
        costByMonth[i] += entryTotalCost(entry);
        usageByMonth[i] += entry.usage;
      }
      const data = MONTH_SHORT.map((label, i) => ({
        month: label,
        monthIndex: i + 1,
        cost: Math.round(costByMonth[i]),
        usage: usageByMonth[i],
      }));
      const max = data.reduce((m, d) => Math.max(m, d.cost), 0);
      return { chartData: data, maxCost: max };
    }

    const defIds = new Set(utilityTypeDefinitions.map((d) => d.id));
    const costByUtility: Record<string, number[]> = {};
    const usageByUtility: Record<string, number[]> = {};
    for (const d of utilityTypeDefinitions) {
      costByUtility[d.id] = new Array(12).fill(0);
      usageByUtility[d.id] = new Array(12).fill(0);
    }
    for (const entry of utilityEntries) {
      if (!defIds.has(entry.utility)) continue;
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== year) continue;
      const i = p.month - 1;
      costByUtility[entry.utility][i] += entryTotalCost(entry);
      usageByUtility[entry.utility][i] += entry.usage;
    }
    const data = MONTH_SHORT.map((label, i) => {
      const row: Record<string, string | number> = {
        month: label,
        monthIndex: i + 1,
      };
      for (const d of utilityTypeDefinitions) {
        row[d.id] = Math.round(costByUtility[d.id][i]);
        row[usageFieldKey(d.id)] = usageByUtility[d.id][i];
      }
      return row;
    });
    let max = 0;
    for (const d of utilityTypeDefinitions) {
      for (let i = 0; i < 12; i++) {
        max = Math.max(max, Math.round(costByUtility[d.id][i]));
      }
    }
    return { chartData: data, maxCost: max };
  }, [
    utilityEntries,
    effectiveUtilityId,
    showAllTypes,
    year,
    utilityTypeDefinitions,
  ]);

  const stroke =
    showAllTypes || selectedDef == null
      ? "var(--chart-1)"
      : strokeForBadgeColor(selectedDef.badgeColor);

  const hasTypes = utilityTypeDefinitions.length > 0;
  const typeLabel = showAllTypes
    ? "All expenses"
    : (selectedDef?.label ?? "Expense type");
  const usageUnitLabel = selectedDef?.defaultUsageUnit ?? "units";

  const unitByUtilityId = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of utilityTypeDefinitions) {
      m.set(d.id, d.defaultUsageUnit);
    }
    return m;
  }, [utilityTypeDefinitions]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Cost by month</CardTitle>
          <CardDescription>
            {showAllTypes
              ? `One line per expense type in ${year} (cost allocated to the billing period start month).`
              : `Total billed cost for one expense type in ${year} (allocated to the billing period start month).`}
          </CardDescription>
        </div>
        {!lockedUtilityId ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Select
              value={utilityId}
              onValueChange={setUtilityId}
              disabled={!hasTypes}
            >
              <SelectTrigger className="w-[220px]" size="sm" aria-label="Expense type">
                <SelectValue placeholder="Expense type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CHART_ALL_EXPENSES}>All</SelectItem>
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
        ) : maxCost === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No{" "}
            {showAllTypes ? "expenses" : `${typeLabel} expenses`} with a start
            date in {year}.
          </p>
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: 0,
                  bottom: showAllTypes ? 28 : 0,
                }}
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

                    if (showAllTypes) {
                      const row = payload[0]?.payload as Record<string, unknown>;
                      return (
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          <p className="font-medium text-popover-foreground">
                            {label} {year}
                          </p>
                          {payload.map((item) => {
                            const key = item.dataKey;
                            if (
                              typeof key !== "string" ||
                              key.startsWith(USAGE_FIELD_PREFIX)
                            ) {
                              return null;
                            }
                            const uRaw = row[usageFieldKey(key)];
                            const usage =
                              typeof uRaw === "number" && Number.isFinite(uRaw)
                                ? uRaw
                                : 0;
                            const unit = unitByUtilityId.get(key) ?? "units";
                            const cost = Number(item.value);
                            const safeCost = Number.isFinite(cost) ? cost : 0;
                            return (
                              <div
                                key={key}
                                className="space-y-0.5 border-b border-border pb-2 last:border-0 last:pb-0"
                              >
                                <p className="text-muted-foreground">
                                  <span
                                    className="me-1 inline-block size-2 rounded-full align-middle"
                                    style={{
                                      backgroundColor: item.color as string,
                                    }}
                                    aria-hidden
                                  />
                                  {item.name}:{" "}
                                  <span className="text-popover-foreground">
                                    {formatWholeDollars(safeCost)}
                                  </span>
                                </p>
                                <p className="ps-3 text-[11px] text-muted-foreground">
                                  Consumption:{" "}
                                  <span className="text-popover-foreground">
                                    {usage.toLocaleString("en-US", {
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    {unit}
                                  </span>
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    const row = payload[0]?.payload as {
                      cost: number;
                      usage: number;
                    };
                    const cost = Number.isFinite(row.cost) ? row.cost : 0;
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
                            {(Number.isFinite(row.usage) ? row.usage : 0).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 2 },
                            )}{" "}
                            {usageUnitLabel}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                {showAllTypes ? (
                  <>
                    {utilityTypeDefinitions.map((d) => (
                      <Line
                        key={d.id}
                        type="monotone"
                        dataKey={d.id}
                        name={d.label}
                        stroke={strokeForBadgeColor(d.badgeColor)}
                        strokeWidth={2}
                        dot={{ r: 2, strokeWidth: 0 }}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) => (
                        <span className="text-muted-foreground">{value}</span>
                      )}
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name={typeLabel}
                    stroke={stroke}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
