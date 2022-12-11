import { stringify } from 'csv-stringify/sync'

import { fromMilliunits, listCategoriesWithGoals } from '@wenabs/core'
import { map } from 'lodash/fp'
import { withWenabsMiddleware } from './with-wenabs-middleware'
import { HttpError } from '@twin-digital/lambda-rest-api'

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

    try {
      const goalCategories = await listCategoriesWithGoals({
        budgetId,
        ynab,
      })

      const records = map(
        (category) => ({
          amountPerMonth: category.goal?.type
            ? fromMilliunits(category.goal?.amountPerMonth ?? 0)
            : undefined,
          category: category.name,
          group: category.group,
          type: category.goal?.type ?? '',
        }),
        goalCategories
      )

      const csv = stringify(records, {
        columns: [
          { header: 'Group', key: 'group' },
          { header: 'Category', key: 'category' },
          { header: 'Type', key: 'type' },
          { header: 'Amount (monthly)', key: 'amountPerMonth' },
        ],
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
