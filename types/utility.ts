export type UtilityType = "electricity" | "water" | "natural_gas" | "trash";

/** Human-readable labels for UI (badges, selects). Keys follow insertion order for `<select>` options. */
export const UTILITY_TYPE_LABELS: Record<UtilityType, string> = {
  electricity: "Electricity",
  water: "Water",
  natural_gas: "Natural gas",
  trash: "Trash",
};

/** Default usage unit shown in the UI for each utility type. */
export const DEFAULT_USAGE_UNIT_BY_UTILITY: Record<UtilityType, string> = {
  electricity: "kWh",
  water: "gal",
  natural_gas: "MMBtu",
  trash: "tons",
};

export type UtilityMetrics = Record<string, number | string | boolean | null>;

export interface CostItem {
  id: string;
  name: string;
  category: "variable" | "fixed" | "taxes" | string;
  rate?: number;
  quantity?: number;
  totalCost: number;
}

export type CostItemFormRow = {
  id: string;
  name: string;
  category: string;
  rate: string;
  quantity: string;
  totalCost: string;
};

export interface UtilityEntry {
  id: string;
  dateStart: string;
  dateEnd: string;
  source?: "manual" | "ai";

  /** Optional note for this billing record (e.g. account, site, or variance). */
  description?: string;

  utility: UtilityType;

  // Core usage (always present)
  usage: number;
  usageUnit: string; // "kWh", "gal", "MMBtu", etc.

  // Optional metrics (vary by utility)
  metrics?: UtilityMetrics;

  // Flexible cost structure
  costItems: CostItem[];
}
