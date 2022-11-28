import { Category } from 'ynab'

/** YNAB goal types */
export const GoalTypes = [
  'Monthly Debt Payment',
  'Monthly Savings Builder',
  'Needed for Spending',
  'Savings Balance',
] as const
export type GoalType = typeof GoalTypes[number]

export interface Goal {
  /** amount needed for this goal, in milliunits */
  readonly amountPerMonth: number

  /**
   * The goal target amount in milliunits
   */
  readonly target: number

  /**
   * The target month for the goal to be completed.  Only some goal types specify this date.
   */
  readonly targetMonth?: string

  /**
   * The type of goal
   */
  readonly type: GoalType

  /**
   * The total amount funded towards the goal within the current goal period.
   */
  readonly overallFunded: number
}

/**
 * Function which, given a category, is able to calculate the monthly contribution toward a goal. Each
 * goal type will use a different calculation function.
 */
export type AmountPerMonthCalculator = (category: Category) => number | null
