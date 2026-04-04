import { create } from "zustand";
import type { CostItem, UtilityEntry, UtilityTypeDefinition } from "@/types/utility";
import {
  DEFAULT_UTILITY_TYPE_DEFINITIONS,
  makeUniqueUtilityId,
  normalizeUtilityTypeDefinitions,
  slugifyUtilityLabel,
  UTILITY_BADGE_COLOR_PRESETS,
} from "@/types/utility";
import { openFile, saveToFile } from "../utils/fileSystem";

/** Map legacy cost line categories from older saved files. */
function migrateCostItemCategory(category: string): string {
  if (category === "usage") return "variable";
  if (category === "demand") return "fixed";
  return category;
}

function migrateUtilityEntry(entry: UtilityEntry): UtilityEntry {
  return {
    ...entry,
    costItems: entry.costItems.map((item: CostItem) => ({
      ...item,
      category: migrateCostItemCategory(item.category),
    })),
  };
}

type PersistedProject = {
  projectTitle?: string;
  utilityEntries?: UtilityEntry[];
  utilityTypeDefinitions?: UtilityTypeDefinition[];
};

function migrateLoadedState(state: PersistedProject): Partial<StoreState> {
  const partial: Partial<StoreState> = {};

  if (state.projectTitle !== undefined) {
    partial.projectTitle = state.projectTitle;
  }

  if (state.utilityTypeDefinitions !== undefined && state.utilityTypeDefinitions.length > 0) {
    partial.utilityTypeDefinitions = normalizeUtilityTypeDefinitions(
      state.utilityTypeDefinitions,
    );
  } else if (
    state.utilityEntries !== undefined &&
    state.utilityEntries.length > 0 &&
    state.utilityTypeDefinitions === undefined
  ) {
    partial.utilityTypeDefinitions = DEFAULT_UTILITY_TYPE_DEFINITIONS;
  }

  if (state.utilityEntries !== undefined) {
    partial.utilityEntries = state.utilityEntries.map(migrateUtilityEntry);
  }

  return partial;
}

function getPersistableSnapshot(state: StoreState): PersistedProject {
  return {
    projectTitle: state.projectTitle,
    utilityEntries: state.utilityEntries,
    utilityTypeDefinitions: state.utilityTypeDefinitions,
  };
}

/** Stable JSON for dirty checks (must match how we set `lastPersistedJson`). */
function persistableJson(state: StoreState): string {
  return JSON.stringify(getPersistableSnapshot(state));
}

function pickLoadedProject(raw: unknown): PersistedProject {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const entries = o.utilityEntries;
  const defs = o.utilityTypeDefinitions;
  return {
    projectTitle: typeof o.projectTitle === "string" ? o.projectTitle : undefined,
    utilityEntries: Array.isArray(entries) ? (entries as UtilityEntry[]) : undefined,
    utilityTypeDefinitions: Array.isArray(defs)
      ? (defs as UtilityTypeDefinition[])
      : undefined,
  };
}

/** Signals ExpenseDrawer to open from anywhere (add vs edit vs duplicate by id). Bump nonce + set intent; drawer consumes and clears intent. */
export type ExpenseDrawerIntent =
  | { mode: "add" }
  | { mode: "edit"; entryId: string }
  | { mode: "duplicate"; entryId: string };

interface StoreState {
  projectTitle: string;
  utilityEntries: UtilityEntry[];
  utilityTypeDefinitions: UtilityTypeDefinition[];
  setProjectTitle: (title: string) => void;
  updateProjectTitle: (title: string) => void;
  addUtilityEntry: (entry: UtilityEntry) => void;
  updateUtilityEntry: (entry: UtilityEntry) => void;
  removeUtilityEntry: (entryId: string) => void;
  addUtilityTypeDefinition: (input: {
    label: string;
    defaultUsageUnit: string;
  }) => void;
  updateUtilityTypeDefinition: (
    id: string,
    patch: { label?: string; defaultUsageUnit?: string; badgeColor?: string },
  ) => void;
  removeUtilityTypeDefinition: (id: string) => boolean;
  utilityTypeEntryCount: (id: string) => number;
  saveState: () => Promise<void>;
  saveAsState: () => Promise<void>;
  /** Returns true if a file was loaded; false if user cancelled or file was empty. */
  loadState: () => Promise<boolean>;
  resetState: () => void;
  /** Incremented whenever an external component requests opening the expense drawer. */
  expenseDrawerNonce: number;
  expenseDrawerIntent: ExpenseDrawerIntent | null;
  requestExpenseDrawerAdd: () => void;
  requestExpenseDrawerEdit: (entryId: string) => void;
  requestExpenseDrawerDuplicate: (entryId: string) => void;
  clearExpenseDrawerIntent: () => void;
  /** Last saved / loaded persisted snapshot; used to detect unsaved edits. */
  lastPersistedJson: string;
}

const electricEntry: UtilityEntry = {
  id: "1",
  dateStart: "2026-03-01",
  dateEnd: "2026-03-31",
  description: "Main plant — March billing cycle",
  utility: "electricity",
  usage: 120000,
  usageUnit: "kWh",
  metrics: {
    peakDemandKW: 450,
  },
  costItems: [
    {
      id: "1",
      name: "Energy Charge",
      category: "variable",
      rate: 0.08,
      quantity: 120000,
      totalCost: 9600,
    },
    {
      id: "2",
      name: "Demand Charge",
      category: "fixed",
      rate: 20,
      quantity: 450,
      totalCost: 9000,
    },
    {
      id: "3",
      name: "Taxes & surcharges",
      category: "taxes",
      totalCost: 200,
    },
  ],
};

const initialAppState = {
  projectTitle: "opex-tracker",
  utilityEntries: [electricEntry] as UtilityEntry[],
  utilityTypeDefinitions: DEFAULT_UTILITY_TYPE_DEFINITIONS,
};

const initialPersistedJson = JSON.stringify(
  getPersistableSnapshot({
    ...initialAppState,
  } as unknown as StoreState),
);

export const useStore = create<StoreState>((set, get) => ({
  ...initialAppState,
  lastPersistedJson: initialPersistedJson,
  expenseDrawerNonce: 0,
  expenseDrawerIntent: null,
  requestExpenseDrawerAdd: () =>
    set((state) => ({
      expenseDrawerIntent: { mode: "add" },
      expenseDrawerNonce: state.expenseDrawerNonce + 1,
    })),
  requestExpenseDrawerEdit: (entryId: string) =>
    set((state) => ({
      expenseDrawerIntent: { mode: "edit", entryId },
      expenseDrawerNonce: state.expenseDrawerNonce + 1,
    })),
  requestExpenseDrawerDuplicate: (entryId: string) =>
    set((state) => ({
      expenseDrawerIntent: { mode: "duplicate", entryId },
      expenseDrawerNonce: state.expenseDrawerNonce + 1,
    })),
  clearExpenseDrawerIntent: () => set({ expenseDrawerIntent: null }),
  setProjectTitle: (title) => set({ projectTitle: title }),
  updateProjectTitle: (title) => set({ projectTitle: title }),
  addUtilityEntry: (entry) =>
    set((state) => ({
      utilityEntries: [...state.utilityEntries, entry],
    })),
  updateUtilityEntry: (entry) =>
    set((state) => ({
      utilityEntries: state.utilityEntries.map((existing) =>
        existing.id === entry.id ? entry : existing,
      ),
    })),
  removeUtilityEntry: (entryId) =>
    set((state) => ({
      utilityEntries: state.utilityEntries.filter((e) => e.id !== entryId),
    })),
  addUtilityTypeDefinition: ({ label, defaultUsageUnit }) => {
    const trimmedLabel = label.trim();
    const trimmedUnit = defaultUsageUnit.trim();
    if (!trimmedLabel || !trimmedUnit) return;
    set((state) => {
      const base = slugifyUtilityLabel(trimmedLabel);
      const id = makeUniqueUtilityId(state.utilityTypeDefinitions, base);
      const colorIdx =
        state.utilityTypeDefinitions.length %
        UTILITY_BADGE_COLOR_PRESETS.length;
      return {
        utilityTypeDefinitions: [
          ...state.utilityTypeDefinitions,
          {
            id,
            label: trimmedLabel,
            defaultUsageUnit: trimmedUnit,
            badgeColor: UTILITY_BADGE_COLOR_PRESETS[colorIdx].id,
          },
        ],
      };
    });
  },
  updateUtilityTypeDefinition: (id, patch) =>
    set((state) => ({
      utilityTypeDefinitions: state.utilityTypeDefinitions.map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
          ...(patch.defaultUsageUnit !== undefined
            ? { defaultUsageUnit: patch.defaultUsageUnit.trim() }
            : {}),
          ...(patch.badgeColor !== undefined &&
          UTILITY_BADGE_COLOR_PRESETS.some((p) => p.id === patch.badgeColor)
            ? { badgeColor: patch.badgeColor }
            : {}),
        };
      }),
    })),
  removeUtilityTypeDefinition: (id) => {
    const state = get();
    if (state.utilityTypeDefinitions.length <= 1) return false;
    if (state.utilityEntries.some((e) => e.utility === id)) return false;
    set({
      utilityTypeDefinitions: state.utilityTypeDefinitions.filter((d) => d.id !== id),
    });
    return true;
  },
  utilityTypeEntryCount: (id) =>
    get().utilityEntries.filter((e) => e.utility === id).length,
  saveState: async () => {
    const state = useStore.getState();
    await saveToFile(
      getPersistableSnapshot(state),
      `${state.projectTitle}.json`,
      window.handle,
    );
    set({ lastPersistedJson: persistableJson(get()) });
  },
  saveAsState: async () => {
    const state = useStore.getState();
    await saveToFile(getPersistableSnapshot(state), `${state.projectTitle}.json`);
    set({ lastPersistedJson: persistableJson(get()) });
  },
  loadState: async () => {
    try {
      const loadedState = pickLoadedProject(await openFile());
      if (
        loadedState.projectTitle != null ||
        loadedState.utilityEntries != null ||
        loadedState.utilityTypeDefinitions != null
      ) {
        set(migrateLoadedState(loadedState));
        set({ lastPersistedJson: persistableJson(get()) });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  },
  resetState: () => {
    set({
      ...initialAppState,
      lastPersistedJson: initialPersistedJson,
      expenseDrawerNonce: 0,
      expenseDrawerIntent: null,
    });
    window.handle = undefined;
  },
}));

/** True when persisted fields differ from the last saved/loaded snapshot. */
export const selectHasUnsavedChanges = (state: StoreState): boolean =>
  persistableJson(state) !== state.lastPersistedJson;
