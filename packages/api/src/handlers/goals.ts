import type {
  APIGatewayEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import { flatten, flow, get, map } from 'lodash/fp'
import middy from '@middy/core'
import ssm from '@middy/ssm'
import { API, Category } from 'ynab'

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

    const ynab = new API(context.ynabToken)

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
      const response = await ynab.categories.getCategories(budgetId)

      const goals = flow(
        map(get('categories')),
        flatten,
        map((category: Category) => ({
          name: category.name,
          type: category.goal_type,
          target: category.goal_target,
          monthsLeft: category.goal_months_to_budget,
        }))
      )(response.data.category_groups)

      return {
        body: JSON.stringify(goals, null, 2),
        headers: {
          'Content-Type': 'application/json',
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
