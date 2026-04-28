import type { Formula } from "./types";

export function evaluateFormula(formula: Formula, rank = 0): number {
  switch (formula.type) {
    case "constant":
      return formula.value;
    case "linear":
      return formula.base + formula.perRank * rank;
    case "exponential":
      return formula.base * Math.pow(formula.multiplier, rank);
    case "additivePercent":
      return 1 + (formula.percentPerRank * rank) / 100;
    case "multiplicativePercent":
      return Math.pow(formula.multiplierPerRank, rank);
  }
}

export function isPositiveFormula(formula: Formula): boolean {
  return evaluateFormula(formula, 1) >= 0 && evaluateFormula(formula, 2) >= 0;
}
