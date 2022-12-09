import path from 'node:path'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

import type { ApiResourceProps } from './api-resource-props'

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

    const getBudgetHandler = new lambda.Function(this, 'GetBudgetHandler', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', '..', 'dist')
      ),
      environment: {
        ACCOUNTS_FUNCTION_ARN: accountsFunction.functionArn,
      },
      handler: 'budgets.getBudget',
      runtime: lambda.Runtime.NODEJS_16_X,
    })
    accountsFunction.grantInvoke(getBudgetHandler)

    const listBudgetsHandler = new lambda.Function(this, 'ListBudgetsHandler', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', '..', 'dist')
      ),
      environment: {
        ACCOUNTS_FUNCTION_ARN: accountsFunction.functionArn,
      },
      handler: 'budgets.listBudgets',
      runtime: lambda.Runtime.NODEJS_16_X,
    })
    accountsFunction.grantInvoke(listBudgetsHandler)

    api.addMethod({
      handler: listBudgetsHandler,
      method: 'ANY',
      path: ['budgets'],
    })
    api.addProxy({
      handler: getBudgetHandler,
      path: ['budgets'],
    })
  }
}
