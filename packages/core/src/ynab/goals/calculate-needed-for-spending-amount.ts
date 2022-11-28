import { Category } from 'ynab'
import { AmountPerMonthCalculator } from './goal'

export const calculateWithEndDate = (category: Category) => {
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

  const amountRemainingAtStartOfMonth = amountRemaining + assigned
  const monthlyAmountNeededAtStartOfMonth =
    amountRemainingAtStartOfMonth / monthsRemaining

  if (assigned > monthlyAmountNeededAtStartOfMonth || assigned < 0) {
    // we withdrew money OR assigned more than needed
    // in either case, assume we are done with this month and spread remaining amount across remaining months
    return amountRemaining / (monthsRemaining - 1)
  } else {
    // 0 <= amountAssigned <= amount needed this month
    // assume we will finish this month, and proceed normally into future
    return amountRemainingAtStartOfMonth / monthsRemaining
  }
}

export const calculateWithoutEndDate = (category: Category) => {
  return category.goal_target ?? null
}

export const calculateNeededForSpendingAmount: AmountPerMonthCalculator = (
  category
) => {
  if (category.goal_type !== Category.GoalTypeEnum.NEED) {
    // not a goal type we handle
    return null
  }

  return category.goal_target_month
    ? calculateWithEndDate(category)
    : calculateWithoutEndDate(category)
}
