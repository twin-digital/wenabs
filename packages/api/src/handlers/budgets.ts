import type {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { invokeLambda } from '../lib/invoke-lambda'
import { API } from 'ynab'

export type GoalsHandlerEnvironment = {
  /** ARN of the accounts lambda, used to retrieve the YNAB token */
  ACCOUNTS_FUNCTION_ARN: string
}

type BudgetsQueryParameters = {
  /**
   * Whether to include the list of budget accounts. Only valid when no budgetId path parameter is specified.
   * @default false
   */
  includeAccounts?: string
}

const getConfig = (): GoalsHandlerEnvironment => {
  const { ACCOUNTS_FUNCTION_ARN } = process.env
  if (!ACCOUNTS_FUNCTION_ARN) {
    throw new Error('ACCOUNTS_FUNCTION_ARN is required.')
  }

  return { ACCOUNTS_FUNCTION_ARN }
}

type YnabClientHandler = (
  event: APIGatewayProxyEvent,
  context: Context & { ynab: API }
) => Promise<Parameters<JSON['stringify']>[0]>

const withYnab =
  (handler: YnabClientHandler) =>
  async (
    event: APIGatewayEvent,
    context: Context
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

    const result = await handler(event, {
      ...context,
      ynab: new API(data.accessToken),
    })

    return {
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
      },
      statusCode: 200,
    }
  }

export const listBudgets = withYnab(async (event, { ynab }) => {
  // TODO: validation - includeAccounts is a valid boolean, etc
  const { includeAccounts = 'false' } =
    event.queryStringParameters ?? ({} as BudgetsQueryParameters)

  return await ynab.budgets.getBudgets(includeAccounts === 'true')
})

export const getBudget = withYnab(async (event, { ynab }) => {
  // TODO: validation
  const budgetId = event.pathParameters?.proxy

  // TODO: return 400 or some other correct response.. or delegate to list budgets?
  if (!budgetId) {
    throw new Error('no budgetId specified')
  }

  return await ynab.budgets.getBudgetById(budgetId)
})