export type UtilityType = "electricity" | "water" | "natural_gas" | "trash";

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

  utility: UtilityType;

  // Core usage (always present)
  usage: number;
  usageUnit: string; // "kWh", "gal", "MMBtu", etc.

  // Optional metrics (vary by utility)
  metrics?: UtilityMetrics;

  // Flexible cost structure
  costItems: CostItem[];
}
