export type UtilityMetrics = Record<string, number | string | boolean | null>;

/**
 * Curated badge colors using design tokens (light/dark aware).
 * `badgeClass` overrides Badge surface; keep border transparent for a pill look.
 */
export const UTILITY_BADGE_COLOR_PRESETS = [
  {
    id: "primary",
    label: "Primary",
    swatchClass: "bg-primary",
    badgeClass:
      "border-transparent bg-primary/15 text-primary dark:bg-primary/25",
  },
  {
    id: "chart-1",
    label: "Blue",
    swatchClass: "bg-chart-1",
    badgeClass:
      "border-transparent bg-chart-1/15 text-chart-1 dark:bg-chart-1/25",
  },
  {
    id: "chart-2",
    label: "Amber",
    swatchClass: "bg-chart-2",
    badgeClass:
      "border-transparent bg-chart-2/15 text-chart-2 dark:bg-chart-2/25",
  },
  {
    id: "chart-3",
    label: "Terracotta",
    swatchClass: "bg-chart-3",
    badgeClass:
      "border-transparent bg-chart-3/15 text-chart-3 dark:bg-chart-3/25",
  },
  {
    id: "chart-4",
    label: "Teal",
    swatchClass: "bg-chart-4",
    badgeClass:
      "border-transparent bg-chart-4/15 text-chart-4 dark:bg-chart-4/25",
  },
  {
    id: "chart-5",
    label: "Violet",
    swatchClass: "bg-chart-5",
    badgeClass:
      "border-transparent bg-chart-5/15 text-chart-5 dark:bg-chart-5/25",
  },
  {
    id: "electricity",
    label: "Electricity",
    swatchClass: "bg-electricity",
    badgeClass:
      "border-transparent bg-electricity/20 text-electricity dark:bg-electricity/25",
  },
  {
    id: "water",
    label: "Water",
    swatchClass: "bg-water",
    badgeClass:
      "border-transparent bg-water/20 text-water dark:bg-water/25",
  },
  {
    id: "gas",
    label: "Gas",
    swatchClass: "bg-gas",
    badgeClass: "border-transparent bg-gas/20 text-gas dark:bg-gas/25",
  },
  {
    id: "muted",
    label: "Neutral",
    swatchClass: "bg-muted-foreground/50",
    badgeClass:
      "border-transparent bg-muted text-muted-foreground dark:bg-muted/80",
  },
] as const;

export function isValidUtilityBadgeColorId(id: string): boolean {
  return UTILITY_BADGE_COLOR_PRESETS.some((p) => p.id === id);
}

export function utilityBadgeClassForColorId(
  badgeColor: string | undefined,
  fallbackIndex: number,
): string {
  const preset = UTILITY_BADGE_COLOR_PRESETS.find((p) => p.id === badgeColor);
  if (preset) return preset.badgeClass;
  const i =
    ((fallbackIndex % UTILITY_BADGE_COLOR_PRESETS.length) +
      UTILITY_BADGE_COLOR_PRESETS.length) %
    UTILITY_BADGE_COLOR_PRESETS.length;
  return UTILITY_BADGE_COLOR_PRESETS[i].badgeClass;
}

type UtilityTypeDefinitionInput = Omit<UtilityTypeDefinition, "badgeColor"> & {
  badgeColor?: string;
};

/** Ensures every definition has a valid `badgeColor`. */
export function normalizeUtilityTypeDefinitions(
  defs: UtilityTypeDefinitionInput[],
): UtilityTypeDefinition[] {
  return defs.map((d, i) => ({
    ...d,
    badgeColor: isValidUtilityBadgeColorId(d.badgeColor ?? "")
      ? d.badgeColor!
      : UTILITY_BADGE_COLOR_PRESETS[
          i % UTILITY_BADGE_COLOR_PRESETS.length
        ].id,
  }));
}

/** Configurable utility category (id is stable; label and default unit are editable). */
export interface UtilityTypeDefinition {
  id: string;
  label: string;
  defaultUsageUnit: string;
  /** Key from `UTILITY_BADGE_COLOR_PRESETS` for expense table badges. */
  badgeColor: string;
}

/** Default types for new projects and legacy files without `utilityTypeDefinitions`. */
export const DEFAULT_UTILITY_TYPE_DEFINITIONS: UtilityTypeDefinition[] = [
  {
    id: "electricity",
    label: "Electricity",
    defaultUsageUnit: "kWh",
    badgeColor: "electricity",
  },
  {
    id: "water",
    label: "Water",
    defaultUsageUnit: "gal",
    badgeColor: "water",
  },
  {
    id: "natural_gas",
    label: "Natural gas",
    defaultUsageUnit: "MMBtu",
    badgeColor: "gas",
  },
  {
    id: "trash",
    label: "Trash",
    defaultUsageUnit: "tons",
    badgeColor: "chart-3",
  },
];

export function utilityLabelFor(
  definitions: UtilityTypeDefinition[],
  utilityId: string,
): string {
  return definitions.find((d) => d.id === utilityId)?.label ?? utilityId;
}

export function defaultUsageUnitFor(
  definitions: UtilityTypeDefinition[],
  utilityId: string,
): string {
  return (
    definitions.find((d) => d.id === utilityId)?.defaultUsageUnit ?? "units"
  );
}

export function slugifyUtilityLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s || "utility";
}

export function makeUniqueUtilityId(
  definitions: UtilityTypeDefinition[],
  base: string,
): string {
  const ids = new Set(definitions.map((d) => d.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

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

  /** Matches `UtilityTypeDefinition.id` from project settings. */
  utility: string;

  // Core usage (always present)
  usage: number;
  usageUnit: string; // "kWh", "gal", "MMBtu", etc.

  // Optional metrics (vary by utility)
  metrics?: UtilityMetrics;

  // Flexible cost structure
  costItems: CostItem[];
}
