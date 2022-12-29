import { filter, flow, map } from 'lodash/fp'

import type { Goal } from '../goals/goal'

import type { YnabApiOptions } from './ynab-api-options'
import { createGoal } from '../goals/create-goal'
import { Category as YnabCategory, CategoryGroup } from 'ynab'

/** Options used when enumerating categories for a budget month */
export interface GetCategoriesForMonthOptions extends YnabApiOptions {
  /** ID of the budget to retrieve goals for */
  budgetId: string

  /** Function used to map category group ids to category group objects */
  getCategoryGroup: (id: string) => Promise<CategoryGroup | undefined>

  /**
   * The budget month to retrieve in ISO format (e.g. 2016-12-01) ("current"
   * can also be used to specify the current calendar month (UTC))
   * @default current
   */
  month?: string
}

export type Category = YnabCategory & {
  /** Goal for this category, or null if none */
  goal: Goal | null

  categoryGroup: CategoryGroup | undefined
}

export type CategoriesForMonth = {
  /**
   * Categories in the budget month. Amounts (budgeted, activity, balance, etc.) are specific
   * to the month.
   **/
  categories: Category[]

  /**
   * The budget month in ISO format (e.g. 2016-12-01)
   */
  month: string
}

/**
 * Retrieves category data for categories in a specific month.
 */
export const getCategoriesForMonth = async ({
  budgetId,
  getCategoryGroup,
  month = 'current',
  ynab,
}: GetCategoriesForMonthOptions): Promise<CategoriesForMonth> => {
  const response = await ynab.months.getBudgetMonth(budgetId, month)

  const categories = await Promise.all(
    flow(
      filter((category: Category) => !category.deleted && !category.hidden),
      map(async (category) => ({
        ...category,
        categoryGroup: await getCategoryGroup(category.category_group_id),
        goal: createGoal(category),
      }))
    )(response.data.month.categories)
  )

  return {
    categories,
    month: response.data.month.month,
  }
}
