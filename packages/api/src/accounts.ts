import middy from '@middy/core'
import ssm from '@middy/ssm'
import type {
  APIGatewayEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

type YnabHandlerEnvironment = {
  YNAB_TOKEN_PARAMETER: string
}

type YnabContext = Context & {
  ynabToken?: string
}

const getConfig = (): YnabHandlerEnvironment => {
  const { YNAB_TOKEN_PARAMETER } = process.env
  if (!YNAB_TOKEN_PARAMETER) {
    throw new Error('YNAB_TOKEN_PARAMETER is required.')
  }

  return { YNAB_TOKEN_PARAMETER }
}

export const getYnabAccount = middy(
  async (
    _event: APIGatewayEvent,
    context: YnabContext
  ): Promise<APIGatewayProxyResult> => {
    if (!context.ynabToken) {
      console.error('No YNAB token was provided in the context')
      return {
        body: JSON.stringify({ message: 'Not found' }, null, 2),
        headers: {
          'Content-Type': 'application/json',
        },
        statusCode: 404,
      }
    }

    return {
      body: JSON.stringify({
        accessToken: context.ynabToken,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      statusCode: 200,
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
