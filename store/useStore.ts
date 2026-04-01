import { create } from "zustand";
import type { UtilityEntry } from "@/types/utility";
import { openFile, saveToFile } from "../utils/fileSystem";

interface StoreState {
  projectTitle: string;
  utilityEntries: UtilityEntry[];
  setProjectTitle: (title: string) => void;
  updateProjectTitle: (title: string) => void;
  addUtilityEntry: (entry: UtilityEntry) => void;
  updateUtilityEntry: (entry: UtilityEntry) => void;
  saveState: () => Promise<void>;
  saveAsState: () => Promise<void>;
  loadState: () => Promise<void>;
  resetState: () => void;
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
      category: "usage",
      rate: 0.08,
      quantity: 120000,
      totalCost: 9600,
    },
    {
      id: "2",
      name: "Demand Charge",
      category: "demand",
      rate: 20,
      quantity: 450,
      totalCost: 9000,
    },
    {
      id: "3",
      name: "Service Fee",
      category: "fixed",
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
        set(loadedState as Partial<StoreState>);
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
