"use client";

import { useMemo } from "react";
import { LabelList, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  entryTotalCost,
  formatMoney,
  parseBillingYearMonth,
} from "@/lib/utils";
import { useStore } from "@/store/useStore";

function formatPercentOfWhole(part: number, whole: number): string {
  if (whole <= 0 || !Number.isFinite(part)) return "0%";
  const pct = (part / whole) * 100;
  if (!Number.isFinite(pct)) return "0%";
  return `${pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

/** Matches stroke colors in `cost-chart` / utility badges. */
function colorForBadgeColor(badgeColor: string): string {
  if (badgeColor === "primary") return "var(--primary)";
  if (badgeColor === "muted") return "var(--muted-foreground)";
  return `var(--${badgeColor})`;
}

export function OverviewUtilityPieChart({ year }: { year: number }) {
  const utilityEntries = useStore((s) => s.utilityEntries);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);

  const { chartData, chartConfig, totalForChart, hasSlices } = useMemo(() => {
    const defIds = new Set(utilityTypeDefinitions.map((d) => d.id));
    const totals: Record<string, number> = {};
    for (const def of utilityTypeDefinitions) {
      totals[def.id] = 0;
    }
    for (const entry of utilityEntries) {
      if (!defIds.has(entry.utility)) continue;
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== year) continue;
      totals[entry.utility] += entryTotalCost(entry);
    }

    const config: ChartConfig = {
      amount: { label: "Amount" },
    };
    const rows: {
      utilityKey: string;
      utilityName: string;
      amount: number;
      fill: string;
      sliceColor: string;
    }[] = [];

    utilityTypeDefinitions.forEach((def, defIndex) => {
      const amt = totals[def.id] ?? 0;
      if (amt <= 0) return;
      const key = `u${defIndex}`;
      const resolved = colorForBadgeColor(def.badgeColor);
      config[key] = {
        label: def.label,
        color: resolved,
      };
      rows.push({
        utilityKey: key,
        utilityName: def.label,
        amount: amt,
        fill: `var(--color-${key})`,
        sliceColor: resolved,
      });
    });

    const totalForChart = rows.reduce((s, d) => s + d.amount, 0);

    const chartData = rows.map((d) => ({
      ...d,
      sliceLabel: `${d.utilityName} ${formatPercentOfWhole(d.amount, totalForChart)}`,
    }));

    return {
      chartData,
      chartConfig: config,
      totalForChart,
      hasSlices: chartData.length > 0,
    };
  }, [utilityEntries, utilityTypeDefinitions, year]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0 text-center sm:items-start sm:text-start">
        <CardTitle className="text-base">Expenses Distribution</CardTitle>
        <CardDescription>
          Share of total recorded cost in {year} for each expense type (billing
          period start date).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {utilityTypeDefinitions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add expense types in Settings to see this chart.
          </p>
        ) : !hasSlices ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recorded costs in {year} to chart.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[280px] w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    nameKey="utilityKey"
                    formatter={(value, _name, item, _index, payload) => {
                      const row = (payload ??
                        (
                          item as {
                            payload?: {
                              utilityName?: string;
                              sliceColor?: string;
                              amount?: number;
                            };
                          }
                        ).payload) as {
                        utilityName?: string;
                        sliceColor?: string;
                        amount?: number;
                      } | null;
                      const label = row?.utilityName ?? "";
                      const swatch =
                        row?.sliceColor ?? "var(--muted-foreground)";
                      const amt = Number(value);
                      return (
                        <div className="flex w-full min-w-52 items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border/60"
                              style={{ backgroundColor: swatch }}
                              aria-hidden
                            />
                            <span className="truncate font-medium text-foreground">
                              {label}
                            </span>
                          </div>
                          <span className="shrink-0 font-medium tabular-nums text-foreground">
                            ${formatMoney(amt)}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="utilityKey"
                stroke="var(--background)"
                strokeWidth={2}
                labelLine={{
                  stroke: "var(--border)",
                  strokeWidth: 1,
                }}
              >
                <LabelList
                  dataKey="sliceLabel"
                  position="outside"
                  className="text-[11px] font-medium fill-foreground"
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      {hasSlices ? (
        <CardFooter className="text-xs text-muted-foreground">
          <p className="leading-relaxed">
            Only expense types with recorded cost in {year} are shown. Slices
            sum to{" "}
            <span className="font-medium text-foreground tabular-nums">
              ${formatMoney(totalForChart)}
            </span>{" "}
            for defined types.
          </p>
        </CardFooter>
      ) : null}
    </Card>
  );
}
