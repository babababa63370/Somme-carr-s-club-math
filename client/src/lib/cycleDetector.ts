import type { CalculationStep, CalculationResult } from "@shared/schema";

export function calculateSquareSum(num: number): CalculationResult {
  const steps: CalculationStep[] = [];
  const seen = new Map<number, number>();
  let current = num;
  let stepNumber = 0;

  while (!seen.has(current)) {
    seen.set(current, stepNumber);
    
    const digits = current.toString().split('').map(Number);
    const squaredDigits = digits.map(d => d * d);
    const sum = squaredDigits.reduce((acc, val) => acc + val, 0);
    
    const calculation = digits
      .map((d, i) => `${d}²`)
      .join(' + ') + ` = ${digits.map((d, i) => squaredDigits[i]).join(' + ')} = ${sum}`;

    steps.push({
      stepNumber,
      originalNumber: current,
      digits,
      calculation,
      result: sum,
      isInCycle: false,
      isCycleStart: false,
    });

    current = sum;
    stepNumber++;
    
    if (stepNumber > 1000) {
      break;
    }
  }

  const cycleStartIndex = seen.has(current) ? seen.get(current)! : steps.length - 1;
  const cycleLength = stepNumber - cycleStartIndex;

  for (let i = cycleStartIndex; i < steps.length; i++) {
    steps[i].isInCycle = true;
  }
  
  if (cycleStartIndex < steps.length) {
    steps[cycleStartIndex].isCycleStart = true;
  }

  return {
    steps,
    cycleStartIndex,
    cycleLength,
  };
}
