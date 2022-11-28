/* eslint-disable @typescript-eslint/no-unused-vars */
import { Category } from 'ynab'

import { createCategoryFixture } from '../../../test/create-category-fixture'
import {
  DatedGoalScenarios,
  DefaultGoalValues,
  expandScenarios,
  GoalTestScenario,
} from '../../../test/goal-scenarios'
import { calculateNeededForSpendingAmount } from './calculate-needed-for-spending-amount'

const invalidGoalTypeScenarios: GoalTestScenario[] = [
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_type: Category.GoalTypeEnum.TB,
    },
    expectedResult: null,
    name: 'goal_type === TB',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_type: Category.GoalTypeEnum.TBD,
    },
    expectedResult: null,
    name: 'goal_type === TBD',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_type: Category.GoalTypeEnum.MF,
    },
    expectedResult: null,
    name: 'goal_type === MF',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_type: Category.GoalTypeEnum.DEBT,
    },
    expectedResult: null,
    name: 'goal_type === DEBT',
  },
]

const datelessGoalTypeScenarios: GoalTestScenario[] = [
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 30000,
      goal_target_month: null,
    },
    expectedResult: 240000,
    name: 'returns full target amount, when goal_target_month === null',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 30000,
      goal_target_month: undefined,
    },
    expectedResult: 240000,
    name: 'returns full target amount , when goal_target_month === undefined',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_months_to_budget: null,
    },
    expectedResult: 120000,
    name: 'returns remaining target amount, when goal_months_to_budget === null',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_months_to_budget: undefined,
    },
    expectedResult: 120000,
    name: 'returns remaining target amount, when goal_months_to_budget === undefined',
  },
]

describe('calculatedNeededForSpendingAmount', () => {
  describe('unhandled goal types', () => {
    it.each(expandScenarios(invalidGoalTypeScenarios))(
      'handles scenario: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture(categoryFixture)
        expect(calculateNeededForSpendingAmount(category)).toEqual(
          expectedResult
        )
      }
    )
  })

  describe('goal_type === NEED', () => {
    it.each(expandScenarios(DatedGoalScenarios))(
      'handles scenario: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture({
          ...categoryFixture,
          goal_type: Category.GoalTypeEnum.NEED,
        })

        expect(calculateNeededForSpendingAmount(category)).toEqual(
          expectedResult
        )
      }
    )

    it.each(expandScenarios(datelessGoalTypeScenarios))(
      'handles scenario without target month: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture({
          ...categoryFixture,
          goal_type: Category.GoalTypeEnum.NEED,
        })

        expect(calculateNeededForSpendingAmount(category)).toEqual(
          expectedResult
        )
      }
    )
  })
})
