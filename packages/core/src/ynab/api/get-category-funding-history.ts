import {
  flatten,
  flow,
  get,
  identity,
  map,
  sortBy,
  uniqBy,
  keyBy,
  uniq,
} from 'lodash/fp'

import type { YnabApiOptions } from './ynab-api-options'
import { CategoryGroup } from 'ynab'
import {
  CategoriesForMonth,
  Category,
  getCategoriesForMonth,
} from './get-categories-for-month'

/** Options used when retrieving goal history for a category a budget */
export interface CategoryWithFundingHistoryOptions extends YnabApiOptions {
  /** ID of the budget to retrieve goals for */
  budgetId: string

  /** Function used to map category group ids to category group objects */
  getCategoryGroup: (id: string) => Promise<CategoryGroup | undefined>

  /**
   * The budget months to retrieve in ISO format (e.g. 2016-12-01) ("current"
   * can also be used to specify the current calendar month (UTC))
   * @default current
   */
  months?: string[]
}

export type CategoryWithFundingHistory = Category & {
  /**
   * History of the funds allocatedto this category. The key is the month in ISO format (e.g. 2016-12-01),
   * and the value is the amount allocated for the category in that month.
   */
  fundingHistory: Record<string, number>

  categoryGroup: CategoryGroup | undefined
}

/** map function to get categores from CategoriesForMonth */
const getCategories = (categoriesForMonth: CategoriesForMonth) =>
  categoriesForMonth.categories

/**
 * Retrieves category data for categories in a specific month.
 */
export const getCategoryFundingHistory = async ({
  budgetId,
  getCategoryGroup,
  months = ['current'],
  ynab,
}: CategoryWithFundingHistoryOptions): Promise<
  CategoryWithFundingHistory[]
> => {
  const budgetMonths = await Promise.all(
    map(
      (month) =>
        getCategoriesForMonth({ budgetId, getCategoryGroup, month, ynab }),
      months
    )
  )

  const budgetMonthsWithCategoryIdMap = map(
    ({ categories, month }) => ({
      categories: keyBy((category) => category.id, categories),
      month,
    }),
    budgetMonths
  )

  const categoryMonthLookup = keyBy(
    ({ month }) => month,
    budgetMonthsWithCategoryIdMap
  )

  // unique set of all categories
  const categoryList = flow(
    map(getCategories),
    flatten,
    uniqBy<Category>(get('id')),
    sortBy((category) => `${category.categoryGroup?.name}_${category.name}`)
  )(budgetMonths)

  // unique list of all months in the requested dataset
  const monthList = flow(
    map((categoriesForMonth: CategoriesForMonth) => categoriesForMonth.month),
    uniq,
    sortBy(identity)
  )(budgetMonths)

  const createFundingHistory = (categoryId: string): Record<string, number> =>
    monthList.reduce(
      (result, month) => ({
        ...result,
        [month]:
          categoryMonthLookup[month].categories[categoryId].budgeted ?? 0,
      }),
      {} as Record<string, number>
    )

  const createCategoryWithAllocationHistory = (
    category: Category
  ): CategoryWithFundingHistory => ({
    ...category,
    fundingHistory: createFundingHistory(category.id),
  })

  return map(createCategoryWithAllocationHistory, categoryList)
}
