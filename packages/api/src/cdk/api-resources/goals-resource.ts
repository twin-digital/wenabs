import path from 'node:path'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

import type { ApiResourceProps } from './api-resource-props'

export type GoalsResourceProps = ApiResourceProps & {
  accountsFunction: lambda.Function
}

/**
 * Root construct of the WENABS API.
 */
export class GoalsResource extends Construct {
  /** Set of methods for this resource */
  public readonly methods: apigateway.Method[] = []

  constructor(
    scope: Construct,
    id: string,
    { accountsFunction, api }: GoalsResourceProps
  ) {
    super(scope, id)

    const goalsHandler = new lambda.Function(this, 'GoalsHandler', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', '..', 'dist')
      ),
      environment: {
        ACCOUNTS_FUNCTION_ARN: accountsFunction.functionArn,
      },
      handler: 'goals.getGoalsCsv',
      runtime: lambda.Runtime.NODEJS_16_X,
    })
    accountsFunction.grantInvoke(goalsHandler)

    api.addMethod({
      handler: goalsHandler,
      methodOptions: {
        operationName: 'GetGoalsCsv',
      },
      path: ['budgets', '{budgetId}', 'goals'],
    })
  }
}
