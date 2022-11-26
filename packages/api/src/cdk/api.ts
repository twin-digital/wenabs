import path from 'node:path'

import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { getSsmPath } from '@twin-digital/cdk-patterns'
import { Stack } from 'aws-cdk-lib'

/**
 * Root construct of the WENABS API.
 */
export class Api extends Construct {
  constructor(scope: Construct, id: string) {
    {
      super(scope, id)

      const ynabTokenSsmPath = getSsmPath({
        component: 'ynab',
        scope: this,
        parameter: 'token',
      })
      const ynabTokenArn = cdk.Arn.format(
        {
          resource: 'parameter',
          // remove initial '/' to avoid doubling it in ARN
          resourceName: ynabTokenSsmPath.substring(1),
          service: 'ssm',
        },
        Stack.of(this)
      )

      const goalsHandler = new lambda.Function(this, 'GoalsHandler', {
        code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'dist')),
        environment: {
          YNAB_TOKEN_PARAMETER: ynabTokenSsmPath,
        },
        handler: 'goals.handler',
        runtime: lambda.Runtime.NODEJS_16_X,
      })

      goalsHandler.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameters'],
          effect: iam.Effect.ALLOW,
          resources: [ynabTokenArn],
          sid: 'ReadYnabToken',
        })
      )

      const api = new apigateway.RestApi(this, 'ApiGateway', {
        description: 'Handles WENABS api requests.',
        restApiName: 'WENABS API',
      })

      const budgets = api.root.addResource('budgets')
      const budget = budgets.addResource('{budgetId}')
      const goals = budget.addResource('goals')
      goals.addMethod('GET', new apigateway.LambdaIntegration(goalsHandler), {
        operationName: 'ListGoals',
      })

      // create an output containing the name of the SSM param that must be created
      new cdk.CfnOutput(this, 'YnabTokenSsmPath', {
        description:
          'SSM path of the YNAB token parameter (MUST CREATE MANUALLY)',
        value: ynabTokenSsmPath,
      })
    }
  }
}
