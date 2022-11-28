import { Category } from 'ynab'
import { calculateWithEndDate } from './calculate-needed-for-spending-amount'
import { AmountPerMonthCalculator } from './goal'

export const calculateSavingsBalanceAmount: AmountPerMonthCalculator = (
  category
) => {
  if (category.goal_type !== Category.GoalTypeEnum.TBD) {
    // not a goal type we handle
    return null
  }

  // 'TBD' requires a target month
  if (
    category.goal_target_month === null ||
    category.goal_target_month === undefined
  ) {
    return null
  }

  const amountRemaining = category.goal_overall_left
  const assigned = category.budgeted
  const monthsRemaining = category.goal_months_to_budget ?? 1

  // amount remaining undefined, we can't handle this
  if (amountRemaining === null || amountRemaining === undefined) {
    return null
  }

  // short circuit if the goal is completed
  if (amountRemaining === 0) {
    return 0
  }

  if (category.activity === 0) {
    // we can use the same logic as 'NEED'-type goals with dates, since they are not impacted by spending
    return calculateWithEndDate(category)
  }

  // if we have spending in the month, we need to account for it

  const amountRemainingAtStartOfMonthWithActivity = amountRemaining + assigned
  const monthlyAmountNeededWithActivity =
    amountRemainingAtStartOfMonthWithActivity / monthsRemaining

  if (assigned >= monthlyAmountNeededWithActivity || assigned <= 0) {
    // we withdrew money OR assigned more than needed
    // in either case, assume we are done with this month and spread remaining amount across remaining months
    return amountRemaining / (monthsRemaining - 1)
  } else {
    // 0 <= amountAssigned <= amount needed this month
    // assume we will finish this month, and proceed normally into future
    return amountRemainingAtStartOfMonthWithActivity / monthsRemaining
  }
}
