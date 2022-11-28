import { filter, flow, map } from 'lodash/fp'
import { API } from 'ynab'

import type { Goal } from '../goals/goal'
import { flattenCategoryGroups } from '../categories'

import type { YnabApiOptions } from './ynab-api-options'
import { createGoal } from '../goals/create-goal'

/** Options used when enumerating goals for a budget */
export interface ListCategoriesWithGoalsOptions extends YnabApiOptions {
  /** ID of the budget to retrieve goals for */
  budgetId: string
}

export type CategoryWithGroupAndGoal = {
  /** Goal for this category, or null if none */
  goal: Goal | null

  /** Category group this category is a part of */
  group: string

  /** Name of the category */
  name: string
}

/**
 * Retrieves a summary of all the categories and goals in a YNAB budget.
 */
export const listCategoriesWithGoals = async ({
  budgetId,
  token,
}: ListCategoriesWithGoalsOptions): Promise<CategoryWithGroupAndGoal[]> => {
  const ynab = new API(token)
  const response = await ynab.categories.getCategories(budgetId)

  return flow(
    flattenCategoryGroups,
    filter((category) => !category.deleted && !category.hidden),
    filter(({ group }) => !group.deleted && !group.hidden),
    map((category) => ({
      goal: createGoal(category),
      group: category.group.name,
      name: category.name,
    }))
  )(response.data.category_groups)
}
