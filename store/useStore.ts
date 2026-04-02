import { create } from "zustand";
import type { CostItem, UtilityEntry } from "@/types/utility";
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
};

function migrateLoadedState(state: PersistedProject): Partial<StoreState> {
  const entries = state.utilityEntries;
  if (!entries?.length) return state as Partial<StoreState>;
  return {
    ...state,
    utilityEntries: entries.map(migrateUtilityEntry),
  };
}

function getPersistableSnapshot(state: StoreState): PersistedProject {
  return {
    projectTitle: state.projectTitle,
    utilityEntries: state.utilityEntries,
  };
}

function pickLoadedProject(raw: unknown): PersistedProject {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const entries = o.utilityEntries;
  return {
    projectTitle: typeof o.projectTitle === "string" ? o.projectTitle : undefined,
    utilityEntries: Array.isArray(entries) ? (entries as UtilityEntry[]) : undefined,
  };
}

/** Signals ExpenseDrawer to open from anywhere (add vs edit by id). Bump nonce + set intent; drawer consumes and clears intent. */
export type ExpenseDrawerIntent =
  | { mode: "add" }
  | { mode: "edit"; entryId: string };

interface StoreState {
  projectTitle: string;
  utilityEntries: UtilityEntry[];
  setProjectTitle: (title: string) => void;
  updateProjectTitle: (title: string) => void;
  addUtilityEntry: (entry: UtilityEntry) => void;
  updateUtilityEntry: (entry: UtilityEntry) => void;
  removeUtilityEntry: (entryId: string) => void;
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
  clearExpenseDrawerIntent: () => void;
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

const initialState = {
  projectTitle: "opex-tracker",
  utilityEntries: [electricEntry] as UtilityEntry[],
};

export const useStore = create<StoreState>((set) => ({
  ...initialState,
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
  saveState: async () => {
    const state = useStore.getState();
    await saveToFile(
      getPersistableSnapshot(state),
      `${state.projectTitle}.json`,
      window.handle,
    );
  },
  saveAsState: async () => {
    const state = useStore.getState();
    await saveToFile(getPersistableSnapshot(state), `${state.projectTitle}.json`);
  },
  loadState: async () => {
    try {
      const loadedState = pickLoadedProject(await openFile());
      if (loadedState.projectTitle != null || loadedState.utilityEntries != null) {
        set(migrateLoadedState(loadedState));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  },
  resetState: () => {
    set(initialState);
    window.handle = undefined;
  },
}));
