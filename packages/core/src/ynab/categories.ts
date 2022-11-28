import { flatten, flow, map } from 'lodash/fp'
import { Category, CategoryGroup, CategoryGroupWithCategories } from 'ynab'

export type CategoryWithGroup = Category & {
  /** the group this category belongs to */
  group: CategoryGroup
}

const addGroupToCategory =
  (group: CategoryGroup) =>
  (category: Category): CategoryWithGroup => ({
    ...category,
    group,
  })

const flattenCategoryGroup = (
  group: CategoryGroupWithCategories
): CategoryWithGroup[] => map(addGroupToCategory(group), group.categories)

/**
 * Given an array of YNAB category groups, returns a merged array containing all categories from all groups. Each
 * category will have a 'group' property added, which is the group containing the category.
 *
 * @param categoryGroups
 * @returns
 */
export const flattenCategoryGroups = (
  categoryGroups: CategoryGroupWithCategories[]
): CategoryWithGroup[] =>
  flow(map(flattenCategoryGroup), flatten)(categoryGroups)
