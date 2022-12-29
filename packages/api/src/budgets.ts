import { HttpError } from '@twin-digital/lambda-rest-api'
import { withWenabsMiddleware } from './with-wenabs-middleware'

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

export const listBudgets = withWenabsMiddleware(async (event, { ynab }) => {
  const { includeAccounts = 'false' } =
    event.queryStringParameters ?? ({} as BudgetsQueryParameters)

  if (includeAccounts !== 'false' && includeAccounts !== 'true') {
    throw new HttpError({
      detail: `Invalid value for query parameter [parameter=includeAccounts, value=${includeAccounts}]`,
      status: 400,
      title: 'Invalid Parameter Value',
    })
  }

  return await ynab.budgets.getBudgets(includeAccounts === 'true')
})

export const getBudget = withWenabsMiddleware(async (event, { ynab }) => {
  const budgetId = event.pathParameters?.budgetId

  if (!budgetId) {
    throw new HttpError({
      detail: `Invalid value for path parameter [parameter=budgetId, value=${budgetId}]`,
      status: 400,
      title: 'Invalid Parameter Value',
    })
  }

  return await ynab.budgets.getBudgetById(budgetId)
})
