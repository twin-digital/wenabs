import middy from '@middy/core'
import httpContentEncoding from '@middy/http-content-encoding'
import httpContentNegotiation from '@middy/http-content-negotiation'
import httpCorsMiddleware from '@middy/http-cors'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpJsonBodyParser from '@middy/http-json-body-parser'
import httpResponseSerializer from '@middy/http-response-serializer'
import httpSecurityHeaders from '@middy/http-security-headers'
import httpUrlEncodePathParser from '@middy/http-urlencode-path-parser'
import validator from '@middy/validator'
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda'
import { jsonApiErrorHandler } from './jsonapi-error-handler'

export type RestApiMiddlewareOptions = {
  /**
   * Options for configuring the CORS middlware.
   * @see https://middy.js.org/docs/middlewares/http-cors/
   */
  cors?: Parameters<typeof httpCorsMiddleware>[0]

  /**
   * Options for configuring AJV validation for event, context, and response objects. If not
   * specified, no validation is performed. Note that at least one of eventSchema or responseSchema
   * is required.
   *
   * @see https://middy.js.org/docs/middlewares/validator/
   */
  validator?: Parameters<typeof validator>[0]
}

/**
 * Wraps a lambda handleware for REST API Gateway events with a variety of useful middlewares.
 * @param handler the handler to wrap
 * @param options optional configuration to customize select middleware
 * @returns the wrapped handler
 */
export const withRestApiMiddleware = (
  handler: APIGatewayProxyHandler,
  options: RestApiMiddlewareOptions = {}
) => {
  const withFirstMiddleware = middy<APIGatewayProxyEvent>(handler)
    .use(httpEventNormalizer())
    .use(httpHeaderNormalizer())
    .use(
      httpContentNegotiation({
        parseCharsets: false,
        parseEncodings: false,
        availableLanguages: ['en'],
        availableMediaTypes: ['application/json'],
      })
    )
    .use(httpUrlEncodePathParser())
    .use(httpJsonBodyParser())
    .use(httpSecurityHeaders())
    .use(httpCorsMiddleware(options.cors))
    .use(httpContentEncoding())
    .use(
      httpResponseSerializer({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
        ],
        defaultContentType: 'application/json',
      })
    )

  // if validator options provided, add that middleware
  const withOptionalValidation =
    options.validator === undefined
      ? withFirstMiddleware
      : withFirstMiddleware.use(validator(options.validator))

  const withAllMiddleware = withOptionalValidation.use(jsonApiErrorHandler())

  return withAllMiddleware
}
