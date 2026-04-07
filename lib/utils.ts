import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { UtilityEntry } from "@/types/utility";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse `yyyy-MM-dd` as a local calendar date (not UTC). Matches expense-drawer storage. */
function parseLocalYmd(dateString: string): Date | undefined {
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d || Number.isNaN(y + m + d)) return undefined;
  return new Date(y, m - 1, d);
}

export const formatDate = (dateString: string) => {
  const local = parseLocalYmd(dateString);
  if (!local) return dateString;
  return local.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateRange = (start: string, end: string) =>
  `${formatDate(start)} - ${formatDate(end)}`;

/** If start/end span exactly one full calendar month (local), return long month + year; else range text. */
export function formatExpensePeriodLabel(start: string, end: string): string {
  const a = parseLocalYmd(start);
  const b = parseLocalYmd(end);
  if (!a || !b) return formatDateRange(start, end);

  if (
    a.getFullYear() !== b.getFullYear() ||
    a.getMonth() !== b.getMonth() ||
    a.getDate() !== 1
  ) {
    return formatDateRange(start, end);
  }

  const lastDay = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
  if (b.getDate() !== lastDay) {
    return formatDateRange(start, end);
  }

  return a.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export const formatMoney = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Year and month from `dateStart` (`yyyy-MM-dd`), for billing-period allocation. */
export function parseBillingYearMonth(
  s: string,
): { year: number; month: number } | null {
  const [ys, ms] = s.trim().split("-");
  const year = Number(ys);
  const month = Number(ms);
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

export function entryTotalCost(entry: UtilityEntry): number {
  return entry.costItems.reduce((sum, item) => sum + item.totalCost, 0);
}

export function formatWholeDollars(n: number): string {
  const rounded = Math.round(Number.isFinite(n) ? n : 0);
  return `$${rounded.toLocaleString("en-US")}`;
}

/**
 * Whole dollars with compact suffix (k / M / B) for large values, e.g. $1.2M, $4.5k.
 * Values under $1k use grouped digits without cents.
 */
export function formatWholeDollarsCompact(n: number): string {
  const rounded = Math.round(Number.isFinite(n) ? n : 0);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);

  if (abs < 1000) {
    return `${sign}$${abs.toLocaleString("en-US")}`;
  }

  /** Value in tenths of the display unit (one decimal place). */
  const fmt = (tenths: number, suffix: string) => {
    const t = Math.round(tenths);
    const s =
      t % 10 === 0 ? String(t / 10) : (t / 10).toFixed(1);
    return `${sign}$${s}${suffix}`;
  };

  if (abs < 1_000_000) {
    return fmt(abs / 100, "k");
  }
  if (abs < 1_000_000_000) {
    return fmt(abs / 100_000, "M");
  }
  return fmt(abs / 100_000_000, "B");
}
