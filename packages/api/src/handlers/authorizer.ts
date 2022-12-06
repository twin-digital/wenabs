import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda'

const createResponse = (
  allow: boolean,
  resource: string
): APIGatewayAuthorizerResult => ({
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: allow ? 'Allow' : 'Deny',
        Resource: resource,
      },
    ],
  },
  principalId: 'user',
})

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const token = event.authorizationToken
  console.log('token:', token)
  switch (token) {
    case 'Bearer allow':
      return createResponse(true, event.methodArn)
    case 'deny':
      return createResponse(false, event.methodArn)
    case 'unauthorized':
      throw 'Unauthorized'
    default:
      throw 'Error: Invalid token'
  }
}
