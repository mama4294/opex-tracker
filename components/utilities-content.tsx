"use client";

import { useMemo, useState } from "react";

import { ConsumptionChart } from "@/components/consumption-chart";
import { CostChart } from "@/components/cost-chart";
import { UnitCostChart } from "@/components/unit-cost-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cn,
  entryTotalCost,
  formatMoney,
  parseBillingYearMonth,
} from "@/lib/utils";
import { UTILITY_BADGE_COLOR_PRESETS } from "@/types/utility";
import { useStore } from "@/store/useStore";

export function UtilitiesContent() {
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

  /** Total cost ÷ total usage for each utility in `displayYear` (billing period start). */
  const yearlyAvgUnitCostByUtilityId = useMemo(() => {
    const totalCost: Record<string, number> = {};
    const totalUsage: Record<string, number> = {};
    for (const entry of utilityEntries) {
      const p = parseBillingYearMonth(entry.dateStart);
      if (!p || p.year !== displayYear) continue;
      const id = entry.utility;
      totalCost[id] = (totalCost[id] ?? 0) + entryTotalCost(entry);
      totalUsage[id] = (totalUsage[id] ?? 0) + entry.usage;
    }
    const out: Record<string, number | null> = {};
    const ids = new Set([
      ...Object.keys(totalCost),
      ...Object.keys(totalUsage),
    ]);
    for (const id of ids) {
      const u = totalUsage[id] ?? 0;
      const c = totalCost[id] ?? 0;
      out[id] =
        u > 0 && Number.isFinite(c) && Number.isFinite(u) ? c / u : null;
    }
    return out;
  }, [utilityEntries, displayYear]);

  return (
    <div className="container mx-auto max-w-4xl space-y-10 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cost, consumption, and unit cost by expense type for the selected
            year.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="text-sm text-muted-foreground"
            id="utilities-year-label"
          >
            Year
          </span>
          <Select
            value={String(displayYear)}
            onValueChange={(v) => setYear(Number(v))}
            aria-labelledby="utilities-year-label"
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

      {utilityTypeDefinitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add expense types in Settings to see utility charts here.
        </p>
      ) : (
        utilityTypeDefinitions.map((def, defIndex) => {
          const colorPreset =
            UTILITY_BADGE_COLOR_PRESETS.find((p) => p.id === def.badgeColor) ??
            UTILITY_BADGE_COLOR_PRESETS[
              defIndex % UTILITY_BADGE_COLOR_PRESETS.length
            ];
          const avgUnitCost = yearlyAvgUnitCostByUtilityId[def.id] ?? null;

          return (
            <section
              key={def.id}
              className="scroll-mt-6 space-y-5 border-b border-border pb-12 last:border-b-0 last:pb-0"
              aria-labelledby={`utility-section-${def.id}`}
            >
              <div
                className={cn(
                  "flex gap-4 rounded-xl border border-border bg-card px-4 py-5 shadow-sm sm:gap-5 sm:px-6 sm:py-6",
                  "ring-1 ring-border/60 dark:ring-border/40",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 shrink-0 self-stretch rounded-full sm:w-2",
                    colorPreset.swatchClass,
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Utility
                  </p>
                  <h2
                    id={`utility-section-${def.id}`}
                    className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                  >
                    {def.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Average cost:{" "}
                    </span>
                    {avgUnitCost != null ? (
                      <span className="tabular-nums text-foreground">
                        ${formatMoney(avgUnitCost)}/{def.defaultUsageUnit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        No usage in {displayYear}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <CostChart year={displayYear} lockedUtilityId={def.id} />
                <ConsumptionChart year={displayYear} lockedUtilityId={def.id} />
                <UnitCostChart year={displayYear} lockedUtilityId={def.id} />
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
