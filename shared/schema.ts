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
