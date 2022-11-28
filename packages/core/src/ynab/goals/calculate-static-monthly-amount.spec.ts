import { Category } from 'ynab'
import { createCategoryFixture } from '../../../test/create-category-fixture'

import { calculateStaticMonthlyAmount } from './calculate-static-monthly-amount'

describe('calculateStaticMonthlyAmount', () => {
  it.each([
    [Category.GoalTypeEnum.NEED],
    [Category.GoalTypeEnum.TBD],
    [null],
    [undefined],
  ])('returns null, when goal_type is %s', (type) => {
    const category = createCategoryFixture({
      goal_target: 10000,
      goal_type: type,
    })

    expect(calculateStaticMonthlyAmount(category)).toBeNull()
  })

  describe.each([[Category.GoalTypeEnum.DEBT], [Category.GoalTypeEnum.MF]])(
    'goal_type = %s',
    (goalType) => {
      describe('invalid goal_target', () => {
        it.each([[null], [undefined]])(
          'returns null, when goal_target is %s',
          (goalTarget) => {
            const category = createCategoryFixture({
              goal_type: goalType,
            })
            category.goal_target = goalTarget

            expect(calculateStaticMonthlyAmount(category)).toBeNull()
          }
        )
      })

      describe('valid goal_target', () => {
        it.each([[0], [10000]])(
          'returns correct value, when goal_target is %s',
          (goalTarget) => {
            const category = createCategoryFixture({
              goal_target: goalTarget,
              goal_type: goalType,
            })

            expect(calculateStaticMonthlyAmount(category)).toEqual(goalTarget)
          }
        )
      })
    }
  )

  it('returns 0, when goal_type === TB', () => {
    const category = createCategoryFixture({
      goal_target: 10000,
      goal_type: Category.GoalTypeEnum.TB,
    })

    expect(calculateStaticMonthlyAmount(category)).toEqual(0)
  })
})

export {}
