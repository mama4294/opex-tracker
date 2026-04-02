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

function migrateLoadedState(state: Partial<StoreState>): Partial<StoreState> {
  if (!state.utilityEntries?.length) return state;
  return {
    ...state,
    utilityEntries: state.utilityEntries.map(migrateUtilityEntry),
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
  loadState: () => Promise<void>;
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
        existing.id === entry.id ? entry : existing
      ),
    })),
  removeUtilityEntry: (entryId) =>
    set((state) => ({
      utilityEntries: state.utilityEntries.filter((e) => e.id !== entryId),
    })),
  saveState: async () => {
    const state = useStore.getState();
    await saveToFile(
      state,
      `${useStore.getState().projectTitle}.json`,
      window.handle
    );
  },
  saveAsState: async () => {
    const state = useStore.getState();
    await saveToFile(state, `${useStore.getState().projectTitle}.json`);
  },
  loadState: async () => {
    try {
      const loadedState = await openFile();
      if (loadedState) {
        set(migrateLoadedState(loadedState as Partial<StoreState>));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  },
  resetState: () => {
    set(initialState);
    window.handle = undefined;
  },
}));
