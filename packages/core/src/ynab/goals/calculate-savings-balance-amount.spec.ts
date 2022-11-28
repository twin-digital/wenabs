/* eslint-disable @typescript-eslint/no-unused-vars */
import { Category } from 'ynab'

import { createCategoryFixture } from '../../../test/create-category-fixture'
import {
  DatedGoalScenarios,
  DefaultGoalValues,
  expandScenarios,
  GoalTestScenario,
} from '../../../test/goal-scenarios'
import { calculateSavingsBalanceAmount } from './calculate-savings-balance-amount'

const invalidGoalTypeScenarios: GoalTestScenario[] = [
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_type: Category.GoalTypeEnum.TB,
    },
    expectedResult: null,
    name: 'goal_type === NEED',
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

const datedGoalScenariosWithActivity: GoalTestScenario[] = [
  {
    categoryFixture: {
      ...DefaultGoalValues,
      activity: 40000,
    },
    expectedResult: 40000, // (120 + 40) / 4, i.e. overall left divided by months left
    name: 'nothing assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      activity: 40000,
      budgeted: 160000,
      goal_overall_left: 0,
    },
    expectedResult: 0, // no remaining goal, since it's been completed
    name: 'goal completed in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      activity: 40000,
      budgeted: 15000,
      goal_overall_left: 120000 - 15000 + 40000,
    },
    expectedResult: 40000, // 120 / 4, i.e. ignore the assigned amount
    name: 'less-than-needed amount assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      activity: 40000,
      budgeted: 30000,
      goal_overall_left: 120000 - 30000 + 40000,
    },
    expectedResult: 40000, // 120 / 4, i.e. ignore the assigned amount
    name: 'needed amount assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      activity: 30000,
      budgeted: 60000,
      goal_overall_left: 120000 - 60000 + 30000,
    },
    expectedResult: 30000, // (120 - 60 + 20) / 3, i.e. spread the overage over the remaining months
    name: 'higher-than-needed amount assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      activity: 30000,
      budgeted: -30000,
      goal_overall_left: 120000 + 30000 + 30000,
    },
    expectedResult: 60000, // (120 + 30) / 3, i.e. spread the extra amount withdrawn over the remaining months
    name: 'negative amount assigned in current month',
  },
]

const datelessGoalTypeScenarios: GoalTestScenario[] = [
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 30000,
      goal_target_month: null,
    },
    expectedResult: null,
    name: 'returns full target amount, when goal_target_month === null',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 30000,
      goal_target_month: undefined,
    },
    expectedResult: null,
    name: 'returns full target amount , when goal_target_month === undefined',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_months_to_budget: null,
    },
    expectedResult: null,
    name: 'returns remaining target amount, when goal_months_to_budget === null',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_months_to_budget: undefined,
    },
    expectedResult: null,
    name: 'returns remaining target amount, when goal_months_to_budget === undefined',
  },
]

describe('calculateSavingsBalanceAmount', () => {
  describe('unhandled goal types', () => {
    it.each(expandScenarios(invalidGoalTypeScenarios))(
      'handles scenario: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture(categoryFixture)
        expect(calculateSavingsBalanceAmount(category)).toEqual(expectedResult)
      }
    )
  })

  describe('goal_type === TBD (WITHOUT activity in current month)', () => {
    it.each(expandScenarios(DatedGoalScenarios))(
      'handles scenario: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture({
          ...categoryFixture,
          goal_type: Category.GoalTypeEnum.TBD,
        })
        expect(calculateSavingsBalanceAmount(category)).toEqual(expectedResult)
      }
    )

    it.each(expandScenarios(datelessGoalTypeScenarios))(
      'handles scenario without target month: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture({
          ...categoryFixture,
          goal_type: Category.GoalTypeEnum.NEED,
        })

        expect(calculateSavingsBalanceAmount(category)).toEqual(expectedResult)
      }
    )
  })

  describe('goal_type === TBD (WITH activity in current month)', () => {
    it.each(expandScenarios(datedGoalScenariosWithActivity))(
      'handles scenario: %s',
      (_name, { categoryFixture, expectedResult }) => {
        const category = createCategoryFixture({
          ...categoryFixture,
          goal_type: Category.GoalTypeEnum.TBD,
        })
        expect(calculateSavingsBalanceAmount(category)).toEqual(expectedResult)
      }
    )
  })
})
