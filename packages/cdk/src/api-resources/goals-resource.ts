import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

import type { ApiResourceProps } from './api-resource-props'
import { LambdaAssets } from '@wenabs/api'
import { NodeLambda } from '../constructs/node-lambda'

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

    const getGoalsCsv = new NodeLambda(this, 'getGoalsCsv', {
      asset: LambdaAssets.getGoalsCsv,
      functionProps: {
        environment: {
          ACCOUNTS_FUNCTION_ARN: accountsFunction.functionArn,
        },
      },
    }).lambdaFunction
    accountsFunction.grantInvoke(getGoalsCsv)

    api.addMethod({
      handler: getGoalsCsv,
      methodOptions: {
        operationName: 'GetGoalsCsv',
      },
      path: ['budgets', '{budgetId}', 'goals'],
    })
  }
}
