import middy from '@middy/core'
import ssm from '@middy/ssm'
import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  Context,
} from 'aws-lambda'

export type AuthorizerEnvironment = {
  VALID_TOKEN_PARAMETER: string
}

type AuthorizerContext = Context & {
  validToken?: string
}

const getConfig = (): AuthorizerEnvironment => {
  const { VALID_TOKEN_PARAMETER } = process.env
  if (!VALID_TOKEN_PARAMETER) {
    throw new Error('VALID_TOKEN_PARAMETER is required.')
  }

  return { VALID_TOKEN_PARAMETER }
}

const createResponse = (allow: boolean): APIGatewayAuthorizerResult => ({
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: allow ? 'Allow' : 'Deny',
        // TODO: restrict this
        Resource: '*',
      },
    ],
  },
  principalId: 'user',
})

export const handler = middy(
  async (
    event: APIGatewayTokenAuthorizerEvent,
    context: AuthorizerContext
  ): Promise<APIGatewayAuthorizerResult> => {
    const validToken = context.validToken
    if (validToken === undefined) {
      console.error(
        `SSM parameter not set: ${getConfig().VALID_TOKEN_PARAMETER}`
      )
      throw new Error('Configuration error')
    }

    const token = event.authorizationToken
    switch (token) {
      case `Bearer ${context.validToken}`:
        return createResponse(true)
      default:
        throw 'Invalid token'
    }
  }
).use(
  ssm({
    fetchData: {
      validToken: getConfig().VALID_TOKEN_PARAMETER,
    },
    setToContext: true,
  })
)
