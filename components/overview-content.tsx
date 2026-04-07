"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConsumptionChart } from "@/components/consumption-chart";
import { CostChart } from "@/components/cost-chart";
import { ExpenseFlowSankey } from "@/components/expense-flow-sankey";
import { OverviewUtilityPieChart } from "@/components/overview-utility-pie-chart";
import { UnitCostChart } from "@/components/unit-cost-chart";
import {
  cn,
  entryTotalCost,
  formatMoney,
  formatWholeDollarsCompact,
  parseBillingYearMonth,
} from "@/lib/utils";
import { utilityBadgeClassForColorId } from "@/types/utility";
import { useStore } from "@/store/useStore";

/** Past/future full years → 12; current calendar year → month index 1–12. */
function monthsForAverageMonthly(year: number, today = new Date()): number {
  const y = today.getFullYear();
  if (year !== y) return 12;
  return today.getMonth() + 1;
}

function averageMonthlyDescription(year: number, today = new Date()): string {
  const y = today.getFullYear();
  if (year < y) {
    return `Annual total for ${year} divided by 12.`;
  }
  if (year > y) {
    return `Total recorded for ${year} divided by 12.`;
  }
  const m = today.getMonth() + 1;
  const through = new Date(year, m - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  return `Year-to-date total divided by ${m} (Jan–${through}).`;
}

function projectedAnnualDescription(year: number, today = new Date()): string {
  const y = today.getFullYear();
  if (year < y) {
    return `Same as the full-year total for ${year} (year is complete).`;
  }
  if (year > y) {
    return `Matches annual total for ${year} (divisor is 12 months).`;
  }
  const m = today.getMonth() + 1;
  const through = new Date(year, m - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  return `Average monthly expense × 12, using Jan–${through} (${m} month${
    m === 1 ? "" : "s"
  } of data).`;
}

type CostLineKind = "variable" | "fixed" | "taxes" | "other";

function costLineKind(category: string): CostLineKind {
  const c = category.trim().toLowerCase();
  if (c === "variable") return "variable";
  if (c === "fixed") return "fixed";
  if (c === "taxes") return "taxes";
  return "other";
}

/**
 * Total cost ÷ total usage for the year (same denominator for variable/fixed/taxes).
 * Usage-weighted; not a simple average of monthly unit costs.
 */
function yearlyBlendedUnitRate(
  costByMonth: number[],
  usageByMonth: number[],
): number | null {
  let totalCost = 0;
  let totalUsage = 0;
  for (let i = 0; i < 12; i++) {
    totalCost += costByMonth[i];
    totalUsage += usageByMonth[i];
  }
  if (totalUsage <= 0 || !Number.isFinite(totalCost) || !Number.isFinite(totalUsage)) {
    return null;
  }
  return totalCost / totalUsage;
}

type AvgMonthlyUnitRow = {
  id: string;
  label: string;
  unit: string;
  badgeColor: string;
  badgeFallbackIndex: number;
  monthsWithData: number;
  total: number | null;
  variable: number | null;
  fixed: number | null;
  taxes: number | null;
  /** Only set when any line item used a non-standard category. */
  other: number | null;
};

export function OverviewContent() {
  const utilityEntries = useStore((s) => s.utilityEntries);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);

  const [year, setYear] = useState(() => new Date().getFullYear());

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    for (const e of utilityEntries) {
      const p = parseBillingYearMonth(e.dateStart);
      if (p) ys.add(p.year);
    }
    ys.add(new Date().getFullYear());
    return [...ys].sort((a, b) => b - a);
  }, [utilityEntries]);

  const displayYear = useMemo(() => {
    if (yearOptions.length === 0) return year;
    return yearOptions.includes(year) ? year : yearOptions[0];
  }, [year, yearOptions]);

  const annualTotalRaw = useMemo(() => {
    let sum = 0;
    for (const entry of utilityEntries) {
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== displayYear) continue;
      sum += entryTotalCost(entry);
    }
    return sum;
  }, [utilityEntries, displayYear]);

  const annualTotalRounded = Math.round(annualTotalRaw);
  const avgMonths = monthsForAverageMonthly(displayYear);
  const averageMonthlyRounded = Math.round(annualTotalRaw / avgMonths);
  const projectedAnnualRounded = Math.round(
    avgMonths > 0 ? (annualTotalRaw * 12) / avgMonths : 0,
  );

  const avgMonthlyUnitByType = useMemo((): AvgMonthlyUnitRow[] => {
    return utilityTypeDefinitions.map((def, defIndex) => {
      const totalCostByMonth = new Array(12).fill(0) as number[];
      const variableByMonth = new Array(12).fill(0) as number[];
      const fixedByMonth = new Array(12).fill(0) as number[];
      const taxesByMonth = new Array(12).fill(0) as number[];
      const otherByMonth = new Array(12).fill(0) as number[];
      const usageByMonth = new Array(12).fill(0) as number[];

      for (const entry of utilityEntries) {
        if (entry.utility !== def.id) continue;
        const p = parseBillingYearMonth(entry.dateStart);
        if (!p || p.year !== displayYear) continue;
        const mi = p.month - 1;
        usageByMonth[mi] += entry.usage;
        totalCostByMonth[mi] += entryTotalCost(entry);
        for (const item of entry.costItems) {
          const bucket = costLineKind(item.category);
          const add = item.totalCost;
          if (bucket === "variable") variableByMonth[mi] += add;
          else if (bucket === "fixed") fixedByMonth[mi] += add;
          else if (bucket === "taxes") taxesByMonth[mi] += add;
          else otherByMonth[mi] += add;
        }
      }

      const monthsWithData = usageByMonth.filter((u) => u > 0).length;
      const hadOtherCost = otherByMonth.some((c) => c > 0);

      return {
        id: def.id,
        label: def.label,
        unit: def.defaultUsageUnit,
        badgeColor: def.badgeColor,
        badgeFallbackIndex: defIndex,
        monthsWithData,
        total: yearlyBlendedUnitRate(totalCostByMonth, usageByMonth),
        variable: yearlyBlendedUnitRate(variableByMonth, usageByMonth),
        fixed: yearlyBlendedUnitRate(fixedByMonth, usageByMonth),
        taxes: yearlyBlendedUnitRate(taxesByMonth, usageByMonth),
        other: hadOtherCost
          ? yearlyBlendedUnitRate(otherByMonth, usageByMonth)
          : null,
      };
    });
  }, [utilityEntries, utilityTypeDefinitions, displayYear]);

  const hasAnyAvgUnitData = avgMonthlyUnitByType.some((r) => r.total != null);
  const showOtherColumn = avgMonthlyUnitByType.some((r) => r.other != null);

  function formatAvgUnitCell(
    value: number | null,
    rowHasData: boolean,
    unit: string,
  ) {
    if (!rowHasData) {
      return <span className="text-muted-foreground">—</span>;
    }
    const n = value ?? 0;
    return (
      <span className="tabular-nums">
        ${formatMoney(n)}/{unit}
      </span>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summary of your factory operating expense project.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="text-sm text-muted-foreground"
            id="overview-year-label"
          >
            Year
          </span>
          <Select
            value={String(displayYear)}
            onValueChange={(v) => setYear(Number(v))}
            aria-labelledby="overview-year-label"
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Annual expenses to date</CardTitle>
            <CardDescription className="min-h-18 text-pretty">
              Total recorded cost in {displayYear} (by billing period start date).
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-0">
            <p className="text-3xl font-semibold tabular-nums">
              {formatWholeDollarsCompact(annualTotalRounded)}
            </p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Average monthly expenses
            </CardTitle>
            <CardDescription className="min-h-18 text-pretty">
              {averageMonthlyDescription(displayYear)}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-0">
            <p className="text-3xl font-semibold tabular-nums">
              {formatWholeDollarsCompact(averageMonthlyRounded)}
            </p>
          </CardContent>
        </Card>
        <Card className="h-full sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Expected annual total
            </CardTitle>
            <CardDescription className="min-h-18 text-pretty">
              {projectedAnnualDescription(displayYear)}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-0">
            <p className="text-3xl font-semibold tabular-nums">
              {formatWholeDollarsCompact(projectedAnnualRounded)}
            </p>
          </CardContent>
        </Card>
      </div>

      <OverviewUtilityPieChart year={displayYear} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Blended unit cost by expense type
          </CardTitle>
          <CardDescription>
            For {displayYear}, total cost ÷ total usage (by billing period start).
            This
            weights months by consumption instead of averaging monthly unit
            rates. Variable, fixed, and taxes use each line&apos;s category; the
            component $/unit columns sum to Total when every dollar is
            categorized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {utilityTypeDefinitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add expense types in Settings to see unit costs here.
            </p>
          ) : !hasAnyAvgUnitData ? (
            <p className="text-sm text-muted-foreground">
              No usage data in {displayYear} to compute unit costs.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Type</TableHead>
                    <TableHead className="text-right">Variable</TableHead>
                    <TableHead className="text-right">Fixed</TableHead>
                    <TableHead className="text-right">Taxes</TableHead>
                    {showOtherColumn ? (
                      <TableHead className="text-right">Other</TableHead>
                    ) : null}
                    <TableHead className="text-right font-semibold">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avgMonthlyUnitByType.map((row) => {
                    const badgeClass = utilityBadgeClassForColorId(
                      row.badgeColor,
                      row.badgeFallbackIndex,
                    );
                    const ok = row.total != null;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1 py-0.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "w-fit border-transparent font-medium shadow-none",
                                badgeClass,
                              )}
                            >
                              {row.label}
                            </Badge>
                            {row.monthsWithData > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {row.monthsWithData} month
                                {row.monthsWithData === 1 ? "" : "s"} with data
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs align-middle">
                          {formatAvgUnitCell(row.variable, ok, row.unit)}
                        </TableCell>
                        <TableCell className="text-right text-xs align-middle">
                          {formatAvgUnitCell(row.fixed, ok, row.unit)}
                        </TableCell>
                        <TableCell className="text-right text-xs align-middle">
                          {formatAvgUnitCell(row.taxes, ok, row.unit)}
                        </TableCell>
                        {showOtherColumn ? (
                          <TableCell className="text-right text-xs align-middle">
                            {formatAvgUnitCell(
                              row.other,
                              ok && row.other != null,
                              row.unit,
                            )}
                          </TableCell>
                        ) : null}
                        <TableCell className="text-right text-xs align-middle font-semibold">
                          {formatAvgUnitCell(row.total, ok, row.unit)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseFlowSankey year={displayYear} />

      <CostChart year={displayYear} />

      <UnitCostChart year={displayYear} />

      <ConsumptionChart year={displayYear} />
    </div>
  );
}
