import { AffordabilityAnalysis, AffordabilityStatus } from '../types';

/**
 * Rent Affordability Analysis Engine
 * Follows industry-standard 30% rule for housing cost-to-income ratios.
 */
export class AffordabilityCalculator {
  public static analyze(monthlyIncome: number, monthlyRent: number): AffordabilityAnalysis {
    if (monthlyIncome <= 0) {
      return {
        monthlyIncome: 0,
        monthlyRent,
        rentToIncomeRatioPercentage: 0,
        status: 'SAFE',
        maxRecommendedRent: 0,
        remainingIncomeAfterRent: 0,
        adviceMessage: 'Please specify your monthly net income to evaluate rental affordability.'
      };
    }

    const ratio = (monthlyRent / monthlyIncome) * 100;
    const maxRecommendedRent = Math.round(monthlyIncome * 0.30);
    const remainingIncome = monthlyIncome - monthlyRent;

    let status: AffordabilityStatus = 'SAFE';
    let adviceMessage = '';

    if (ratio <= 28) {
      status = 'SAFE';
      adviceMessage = 'Excellent affordability. Housing costs are comfortably under the 30% financial safety guideline, leaving healthy room for savings and essentials.';
    } else if (ratio <= 35) {
      status = 'MODERATE';
      adviceMessage = 'Acceptable budget allocation. Rent represents a reasonable portion of your income, but monitor secondary utility and living expenses.';
    } else if (ratio <= 48) {
      status = 'HIGH_BURDEN';
      adviceMessage = 'Caution: High rent burden. Rent takes over a third of your monthly earnings, which could strain unexpected emergency savings.';
    } else {
      status = 'UNREALISTIC';
      adviceMessage = 'High financial risk. Rent exceeds 50% of your earnings. Financial experts strongly recommend searching for lower-rent alternatives.';
    }

    return {
      monthlyIncome,
      monthlyRent,
      rentToIncomeRatioPercentage: Number(ratio.toFixed(1)),
      status,
      maxRecommendedRent,
      remainingIncomeAfterRent: remainingIncome,
      adviceMessage
    };
  }
}
