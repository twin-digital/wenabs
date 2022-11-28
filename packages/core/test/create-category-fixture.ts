import { merge } from 'lodash'
import type { DeepPartial } from 'utility-types'
import { Category } from 'ynab'

const DefaultCategory: Category = {
  activity: 0,
  balance: 0,
  budgeted: 0,
  category_group_id: 'f0d89d1d-4753-4ed4-a2c7-a385e0b9e6ef',
  deleted: false,
  hidden: false,
  id: 'bf9cc0f5-3f1b-458a-b66f-8d689a503a58',
  name: '[TEST] Default Category Fixture',
}

/**
 * Creates a category fixture containing default values. Any value present in the specified overrides will be used instead.
 **/
export const createCategoryFixture = (
  overrides: DeepPartial<Category> = {}
): Category => merge({}, DefaultCategory, overrides)
