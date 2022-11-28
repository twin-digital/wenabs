import { find, map } from 'lodash/fp'
import { Category } from 'ynab'

import { calculateStaticMonthlyAmount } from './calculate-static-monthly-amount'
import { calculateNeededForSpendingAmount } from './calculate-needed-for-spending-amount'
import { calculateSavingsBalanceAmount } from './calculate-savings-balance-amount'
import { getGoalType } from './get-goal-type'
import { Goal } from './goal'

const AmountPerMonthCalculators = [
  calculateStaticMonthlyAmount,
  calculateNeededForSpendingAmount,
  calculateSavingsBalanceAmount,
] as const

/**
 * Creates a Goal object, given the Category from a YNAB response. Returns null if the category does not have a goal.
 */
export const createGoal = (category: Category): Goal | null => {
  if (!category.goal_type) {
    return null
  }

  const goalType = getGoalType(category.goal_type)
  const calculatedAmountsPerMonth = map(
    (calculate) => calculate(category),
    AmountPerMonthCalculators
  )

  // if no calculator knew how to calculate a monthly contribution for this category, assume zero
  const amountPerMonth =
    find((amount) => amount !== null, calculatedAmountsPerMonth) ?? 0

  return {
    amountPerMonth,
    overallFunded: category.goal_overall_funded ?? 0,
    target: category.goal_target ?? 0,
    targetMonth: category.goal_target_month ?? undefined,
    type: goalType,
  }
}
