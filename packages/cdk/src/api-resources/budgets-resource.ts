import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

import type { ApiResourceProps } from './api-resource-props'
import { LambdaAssets } from '@wenabs/api'
import { NodeLambda } from '../constructs/node-lambda'

export type BudgetsResourceProps = ApiResourceProps & {
  accountsFunction: lambda.Function
}

/**
 * Creates resources for the 'budgets' API endpoints.
 */
export class BudgetsResource extends Construct {
  /** Set of methods for this resource */
  public readonly methods: apigateway.Method[] = []

  constructor(
    scope: Construct,
    id: string,
    { accountsFunction, api }: BudgetsResourceProps
  ) {
    super(scope, id)

    const getBudget = new NodeLambda(this, 'GetBudget', {
      asset: LambdaAssets.getBudget,
      functionProps: {
        environment: {
          ACCOUNTS_FUNCTION_ARN: accountsFunction.functionArn,
        },
      },
    }).lambdaFunction
    accountsFunction.grantInvoke(getBudget)

    const listBudgets = new NodeLambda(this, 'ListBudgets', {
      asset: LambdaAssets.listBudgets,
      functionProps: {
        environment: {
          ACCOUNTS_FUNCTION_ARN: accountsFunction.functionArn,
        },
      },
    }).lambdaFunction
    accountsFunction.grantInvoke(listBudgets)

    api.addMethod({
      handler: listBudgets,
      method: 'GET',
      methodOptions: {
        operationName: 'ListBudgets',
      },
      path: ['budgets'],
    })
    api.addMethod({
      handler: getBudget,
      method: 'GET',
      methodOptions: {
        operationName: 'GetBudget',
      },
      path: ['budgets', '{budgetId}'],
    })
  }
}
