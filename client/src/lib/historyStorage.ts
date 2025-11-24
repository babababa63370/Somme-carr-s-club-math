import type { HistoryEntry, CalculationResult } from "@shared/schema";

const HISTORY_KEY = "cycle-detector-history";
const MAX_HISTORY_ITEMS = 50;

export function getHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading history:", error);
    return [];
  }
}

export function addToHistory(inputNumber: number, result: CalculationResult): void {
  try {
    const history = getHistory();
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${inputNumber}`,
      inputNumber,
      timestamp: Date.now(),
      result,
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error saving to history:", error);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing history:", error);
  }
}

export function deleteHistoryEntry(id: string): void {
  try {
    const history = getHistory();
    const updatedHistory = history.filter(entry => entry.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error deleting history entry:", error);
  }
}
