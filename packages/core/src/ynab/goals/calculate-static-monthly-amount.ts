import { Category } from 'ynab'
import { AmountPerMonthCalculator } from './goal'

/**
 * Calculates a monthly goal amount for goals that are the same every month, regardless of allocation or progress.
 */
export const calculateStaticMonthlyAmount: AmountPerMonthCalculator = (
  category
) => {
  switch (category.goal_type) {
    case Category.GoalTypeEnum.DEBT:
    case Category.GoalTypeEnum.MF:
      return category.goal_target ?? null

    case Category.GoalTypeEnum.TB:
      return 0

    default:
      return null
  }
}
