import { map } from 'lodash/fp'
import { DeepPartial } from 'utility-types'
import { Category } from 'ynab'

export interface GoalTestScenario {
  categoryFixture: DeepPartial<Category>
  expectedResult: number | null
  name: string
}

export const DefaultGoalValues: DeepPartial<Category> = {
  budgeted: 0,
  goal_months_to_budget: 4,
  goal_overall_left: 120000,
  goal_target: 240000,
  goal_target_month: '2023-04-15', // this does not scale with 'now', but our code only cares if it is/isn't "undefined"
}

export const expandScenarios = (scenarios: GoalTestScenario[]) =>
  map(
    (scenario): [string, GoalTestScenario] => [scenario.name, scenario],
    scenarios
  )

export const DatedGoalScenarios = [
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_overall_left: null,
    },
    expectedResult: null,
    name: 'goal_overall_left === null',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      goal_overall_left: undefined,
    },
    expectedResult: null,
    name: 'goal_overall_left === undefined',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
    },
    expectedResult: 30000, // 120 / 4, i.e. overall left divided by months left
    name: 'nothing assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 120000,
      goal_overall_left: 0,
    },
    expectedResult: 0, // no remaining goal, since it's been completed
    name: 'goal completed in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 15000,
      goal_overall_left: 120000 - 15000,
    },
    expectedResult: 30000, // 120 / 4, i.e. ignore the assigned amount
    name: 'less-than-needed amount assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 30000,
      goal_overall_left: 120000 - 30000,
    },
    expectedResult: 30000, // 120 / 4, i.e. ignore the assigned amount
    name: 'needed amount assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: 60000,
      goal_overall_left: 120000 - 60000,
    },
    expectedResult: 20000, // (120 - 60) / 3, i.e. spread the overage over the remaining months
    name: 'higher-than-needed amount assigned in current month',
  },
  {
    categoryFixture: {
      ...DefaultGoalValues,
      budgeted: -30000,
      goal_overall_left: 120000 + 30000,
    },
    expectedResult: 50000, // (120 + 30) / 3, i.e. spread the extra amount withdrawn over the remaining months
    name: 'negative amount assigned in current month',
  },
]
