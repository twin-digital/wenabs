import { Category } from 'ynab'
import { GoalType } from './goal'

/**
 * Converts a YNAB goal type code into a goal type.
 */
export const getGoalType = (type: Category.GoalTypeEnum): GoalType => {
  switch (type) {
    case Category.GoalTypeEnum.DEBT:
      return 'Monthly Debt Payment'
    case Category.GoalTypeEnum.MF:
      return 'Monthly Savings Builder'
    case Category.GoalTypeEnum.NEED:
      return 'Needed for Spending'
    case Category.GoalTypeEnum.TB:
    case Category.GoalTypeEnum.TBD:
      return 'Savings Balance'
    default:
      throw new Error(`Invalid goal type: ${type}`)
  }
}
