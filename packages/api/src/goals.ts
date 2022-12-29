import { stringify } from 'csv-stringify/sync'

import {
  fromMilliunits,
  getCategoryFundingHistory,
  getCategoryGroup,
} from '@wenabs/core'
import { keys, map, split } from 'lodash/fp'
import { withWenabsMiddleware } from './with-wenabs-middleware'
import { HttpError } from '@twin-digital/lambda-rest-api'
import {} from 'lodash'

export type GoalsHandlerEnvironment = {
  /** ARN of the accounts lambda, used to retrieve the YNAB token */
  ACCOUNTS_FUNCTION_ARN: string
}

export const getGoalsCsv = withWenabsMiddleware(
  async (event, { ynab }) => {
    const budgetId = event.pathParameters?.budgetId
    if (!budgetId) {
      throw new HttpError({
        detail: 'Missing budgetId',
        status: 400,
        title: 'Invalid Parameter Value',
      })
    }

    const monthsParam = event.queryStringParameters?.months
    const months = monthsParam ? split(',', monthsParam) : []

    try {
      const findCategoryGroup = await getCategoryGroup({
        budgetId,
        ynab,
      })

      const categories = await getCategoryFundingHistory({
        budgetId,
        getCategoryGroup: findCategoryGroup,
        months,
        ynab,
      })

      const records = map(
        (category) => ({
          amountPerMonth: category.goal?.type
            ? fromMilliunits(category.goal?.amountPerMonth ?? 0)
            : undefined,
          category: category.name,
          group: category.categoryGroup?.name,
          type: category.goal?.type ?? '',
          ...keys(category.fundingHistory).reduce(
            (result, month) => ({
              ...result,
              [month]: fromMilliunits(category.fundingHistory[month]),
            }),
            {} as Record<string, number | undefined>
          ),
        }),
        categories
      )

      const csv = stringify(records, {
        columns: [
          { header: 'Group', key: 'group' },
          { header: 'Category', key: 'category' },
          { header: 'Type', key: 'type' },
          ...months.map((month) => ({ header: month, key: month })),
          { header: 'Goal (monthly)', key: 'amountPerMonth' },
        ],
        header: true,
      })

      // processed by middy HttpResponseSerializer middleware
      ;(event as any).requiredContentType = 'text/csv'
      return csv
    } catch (err: any) {
      console.error('YNAB error:', err)

      throw new HttpError({
        detail: 'Error processing budget data',
        title: 'YNAB Data Error',
      })
    }
  },
  {
    restApiMiddlewareOptions: {
      contentNegotation: {
        parseCharsets: false,
        parseEncodings: false,
        availableLanguages: ['en'],
        availableMediaTypes: ['text/csv'],
      },
    },
  }
)
