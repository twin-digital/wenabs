import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import { stringify } from 'csv-stringify/sync'

import { fromMilliunits, listCategoriesWithGoals } from '@wenabs/core'
import { map } from 'lodash/fp'
import { invokeLambda } from '../lib/invoke-lambda'

export type GoalsHandlerEnvironment = {
  /** ARN of the accounts lambda, used to retrieve the YNAB token */
  ACCOUNTS_FUNCTION_ARN: string
}

const getConfig = (): GoalsHandlerEnvironment => {
  const { ACCOUNTS_FUNCTION_ARN } = process.env
  if (!ACCOUNTS_FUNCTION_ARN) {
    throw new Error('ACCOUNTS_FUNCTION_ARN is required.')
  }

  return { ACCOUNTS_FUNCTION_ARN }
}

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: a parameter specifying WHICH account should be needed
  const { data } = await invokeLambda<{ accessToken: string }>({
    functionName: getConfig().ACCOUNTS_FUNCTION_ARN,
  })

  if (!data.accessToken) {
    console.error('Failed to retrieve YNAB token')
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
      token: data.accessToken,
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
