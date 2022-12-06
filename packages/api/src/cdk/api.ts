import path from 'node:path'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { SsmSecret } from './constructs/ssm-secret'

/**
 * Root construct of the WENABS API.
 */
export class Api extends Construct {
  constructor(scope: Construct, id: string) {
    {
      super(scope, id)

      const ynabTokenSecret = new SsmSecret(this, 'YnabToken', {
        ssmPathOptions: {
          component: 'ynab',
          parameter: 'token',
        },
      })

      const validAuthToken = new SsmSecret(this, 'ValidAuthToken', {
        ssmPathOptions: {
          component: 'authorizer',
          parameter: 'valid-token',
        },
      })

      const authorizerHandler = new lambda.Function(this, 'AuthorizerHandler', {
        code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'dist')),
        environment: {
          VALID_TOKEN_PARAMETER: validAuthToken.ssmPath,
        },
        handler: 'authorizer.handler',
        runtime: lambda.Runtime.NODEJS_16_X,
      })
      authorizerHandler.addToRolePolicy(validAuthToken.readPolicyStatement)

      const authorizer = new apigateway.TokenAuthorizer(this, 'Authorizer', {
        handler: authorizerHandler,
      })

      const goalsHandler = new lambda.Function(this, 'GoalsHandler', {
        code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'dist')),
        environment: {
          YNAB_TOKEN_PARAMETER: ynabTokenSecret.ssmPath,
        },
        handler: 'goals.handler',
        runtime: lambda.Runtime.NODEJS_16_X,
      })
      goalsHandler.addToRolePolicy(ynabTokenSecret.readPolicyStatement)

      const api = new apigateway.RestApi(this, 'ApiGateway', {
        defaultMethodOptions: {
          authorizer,
        },
        description: 'Handles WENABS api requests.',
        restApiName: 'WENABS API',
      })

      const budgets = api.root.addResource('budgets')
      const budget = budgets.addResource('{budgetId}')
      const goals = budget.addResource('goals')
      goals.addMethod('GET', new apigateway.LambdaIntegration(goalsHandler), {
        operationName: 'ListGoals',
      })
    }
  }
}
