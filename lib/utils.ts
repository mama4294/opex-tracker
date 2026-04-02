import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export const formatMoney = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
