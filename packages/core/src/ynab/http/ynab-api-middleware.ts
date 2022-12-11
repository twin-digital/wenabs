import middy from '@middy/core'
import { HttpError, invokeLambda } from '@twin-digital/lambda-rest-api'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda'
import { isEmpty } from 'lodash/fp'
import { API } from 'ynab'
import { isYnabErrorResponse, ynabErrorToHttpError } from '../errors'

export type YnabApiMiddlewareOptions = {
  /**
   * Name of the Accounts lambda function, in one of the formats accepted by the AWS Lambda Invoke API.
   */
  accountsFunction: string
}

export type Context = LambdaContext & {
  ynab: API
}

/**
 * Middy middleware that adds a YNAB 'API' instance to the context, with the key 'ynab'. Will throw
 * an HttpError if no access token is available, which should be handled by an appropriate error handling
 * middleware.
 */
export const ynabApiMiddleware = ({
  accountsFunction,
}: YnabApiMiddlewareOptions): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Error,
  Context
> => ({
  before: async (request) => {
    if (isEmpty(accountsFunction)) {
      throw new HttpError({
        detail: 'No accounts function specified',
        title: 'Configuration Error',
      })
    }

    // TODO: a parameter specifying WHICH account should be needed
    const { data } = await invokeLambda<{ accessToken: string }>({
      functionName: accountsFunction,
    })

    if (!data.accessToken) {
      throw new HttpError({
        detail: 'No YNAB account information found',
        title: 'Configuration Error',
      })
    }

    request.context.ynab = new API(data.accessToken)
  },
  onError: async (request) => {
    const error = request.error
    if (isYnabErrorResponse(error)) {
      request.error = ynabErrorToHttpError(error.error)
    }
  },
})
