import middy from '@middy/core'
import {
  restApiMiddleware,
  RestApiMiddlewareOptions,
} from '@twin-digital/lambda-rest-api'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { API } from 'ynab'

import { ynabApiMiddleware } from '@wenabs/core'

export type YnabClientHandler = (
  event: APIGatewayProxyEvent,
  context: Context & { ynab: API }
) => Promise<Parameters<JSON['stringify']>[0]>

export type YnabApiMiddlewareOptions = {
  /**
   * Name of the Accounts lambda function, in one of the formats accepted by the AWS Lambda Invoke API.
   * @default process.env.ACCOUNTS_FUNCTION_ARN
   */
  accountsFunction?: string

  /**
   * Optional configuration options for the REST API middlewares.
   * @defaults no custom options
   */
  restApiMiddlewareOptions?: RestApiMiddlewareOptions
}

export const withWenabsMiddleware = (
  handler: YnabClientHandler,
  {
    accountsFunction = process.env.ACCOUNTS_FUNCTION_ARN ?? '',
    restApiMiddlewareOptions = {},
  }: YnabApiMiddlewareOptions = {}
) =>
  middy(handler).use(restApiMiddleware(restApiMiddlewareOptions)).use(
    ynabApiMiddleware({
      accountsFunction,
    })
  )
