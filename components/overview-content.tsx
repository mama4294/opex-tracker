"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { CostChart } from "@/components/cost-chart";
import { UnitCostChart } from "@/components/unit-cost-chart";
import {
  entryTotalCost,
  formatWholeDollars,
  parseBillingYearMonth,
} from "@/lib/utils";
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

export function OverviewContent() {
  const utilityEntries = useStore((s) => s.utilityEntries);

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

  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.includes(year)) {
      setYear(yearOptions[0]);
    }
  }, [yearOptions, year]);

  const annualTotalRaw = useMemo(() => {
    let sum = 0;
    for (const entry of utilityEntries) {
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== year) continue;
      sum += entryTotalCost(entry);
    }
    return sum;
  }, [utilityEntries, year]);

  const annualTotalRounded = Math.round(annualTotalRaw);
  const avgMonths = monthsForAverageMonthly(year);
  const averageMonthlyRounded = Math.round(annualTotalRaw / avgMonths);

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
          <span className="text-sm text-muted-foreground" id="overview-year-label">
            Year
          </span>
          <Select
            value={String(year)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Annual expenses to date</CardTitle>
            <CardDescription>
              Total recorded cost in {year} (by billing period start date).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {formatWholeDollars(annualTotalRounded)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average monthly expenses</CardTitle>
            <CardDescription>
              {averageMonthlyDescription(year)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {formatWholeDollars(averageMonthlyRounded)}
            </p>
          </CardContent>
        </Card>
      </div>

      <CostChart year={year} />

      <UnitCostChart year={year} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next steps</CardTitle>
          <CardDescription>
            Add or review utility bills and line-item costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/expenses">
              <Receipt className="size-4" aria-hidden />
              Go to expenses
              <ArrowRight className="size-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
