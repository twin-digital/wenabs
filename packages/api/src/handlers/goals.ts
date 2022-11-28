import middy from '@middy/core'
import ssm from '@middy/ssm'
import type {
  APIGatewayEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import { stringify } from 'csv-stringify/sync'

import { fromMilliunits, listCategoriesWithGoals } from '@wenabs/core'
import { map } from 'lodash/fp'

export type GoalsHandlerEnvironment = {
  YNAB_TOKEN_PARAMETER: string
}

type GoalsHandlerContext = Context & {
  ynabToken?: string
}

const getConfig = (): GoalsHandlerEnvironment => {
  const { YNAB_TOKEN_PARAMETER } = process.env
  if (!YNAB_TOKEN_PARAMETER) {
    throw new Error('YNAB_TOKEN_PARAMETER is required.')
  }

  return { YNAB_TOKEN_PARAMETER }
}

export const handler = middy(
  async (
    event: APIGatewayEvent,
    context: GoalsHandlerContext
  ): Promise<APIGatewayProxyResult> => {
    if (!context.ynabToken) {
      console.error('No YNAB token was provided in the context')
      return {
        body: JSON.stringify({ message: 'Internal server error' }, null, 2),
        headers: {
          'Content-Type': 'application/json',
        },
        statusCode: 500,
      }
    }

    const budgetId = event.pathParameters?.budgetId
    if (!budgetId) {
      return {
        body: 'budgetId is required',
        headers: {
          'Content-Type': 'application/json',
        },
        statusCode: 400,
      }
    }

    try {
      const goalCategories = await listCategoriesWithGoals({
        budgetId,
        token: context.ynabToken,
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

      return {
        body: csv,
        headers: {
          'Content-Type': 'text/csv',
        },
        statusCode: 200,
      }
    } catch (err: any) {
      console.error('YNAB error:', err)

      return {
        body: JSON.stringify({ message: err?.message }, null, 2),
        headers: {
          'Content-Type': 'application/json',
        },
        statusCode: 500,
      }
    }
  }
).use(
  ssm({
    fetchData: {
      ynabToken: getConfig().YNAB_TOKEN_PARAMETER,
    },
    setToContext: true,
  })
)
