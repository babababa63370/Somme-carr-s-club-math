export interface CalculationStep {
  stepNumber: number;
  originalNumber: number;
  digits: number[];
  calculation: string;
  result: number;
  isInCycle: boolean;
  isCycleStart: boolean;
}

export interface CalculationResult {
  steps: CalculationStep[];
  cycleStartIndex: number;
  cycleLength: number;
}

export interface HistoryEntry {
  id: string;
  inputNumber: number;
  timestamp: number;
  result: CalculationResult;
}

export interface MultiCalculationResult {
  inputNumber: number;
  result: CalculationResult;
}
