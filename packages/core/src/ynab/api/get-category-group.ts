import { CategoryGroup } from 'ynab'
import { YnabApiOptions } from './ynab-api-options'

export type GetCategoryGroupOptions = YnabApiOptions & {
  budgetId: string
}

const getCategoryGroupsById = async ({
  budgetId,
  ynab,
}: GetCategoryGroupOptions): Promise<Record<string, CategoryGroup>> => {
  const response = await ynab.budgets.getBudgetById(budgetId)
  const categoryGroupList = response.data.budget.category_groups ?? []

  return categoryGroupList.reduce(
    (records, categoryGroup) => ({
      ...records,
      [categoryGroup.id]: categoryGroup,
    }),
    {} as Record<string, CategoryGroup>
  )
}

export const getCategoryGroup = async (options: GetCategoryGroupOptions) => {
  const categoryGroups = await getCategoryGroupsById(options)

  return async (id: string): Promise<CategoryGroup | undefined> => {
    return categoryGroups[id]
  }
}
