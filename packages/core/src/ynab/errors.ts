import { HttpError } from '@twin-digital/lambda-rest-api'
import { isString } from 'lodash/fp'
import { ErrorDetail, ErrorResponse } from 'ynab'

export function isYnabErrorDetail(obj: unknown): obj is ErrorDetail {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'detail' in obj &&
    isString(obj.id) &&
    isString(obj.name) &&
    isString(obj.detail)
  )
}

export function isYnabErrorResponse(obj: unknown): obj is ErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    isYnabErrorDetail(obj.error)
  )
}

export const ynabErrorToHttpError = (error: ErrorDetail): HttpError => {
  switch (error.id) {
    case '404':
    case '404.1':
    case '404.2':
      return new HttpError({
        detail: `YNAB error id: ${error.id}`,
        status: 404,
        title: 'Not Found',
      })

    case '500':
    case '503':
      return new HttpError({
        detail: `YNAB error id: ${error.id}`,
        status: 502,
        title: 'Error Accessing YNAB',
      })

    default:
      return new HttpError({
        detail: `YNAB error id: ${error.id}`,
        status: 500,
        title: 'Error Accessing YNAB',
      })
  }
}
