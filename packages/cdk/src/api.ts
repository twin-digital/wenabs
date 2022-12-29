import { Construct } from 'constructs'

import { AccountsResource } from './api-resources/accounts-resource'
import { GoalsResource } from './api-resources/goals-resource'
import { BudgetsResource } from './api-resources/budgets-resource'
import { LambdaAuthorizer } from './constructs/lambda-authorizer'
import { RestApi } from '@twin-digital/cdk-patterns'

/**
 * Root construct of the WENABS API.
 */
export class Api extends Construct {
  constructor(scope: Construct, id: string) {
    {
      super(scope, id)

      // create API gateway rest api
      const authorizer = new LambdaAuthorizer(this, 'Authorizer')
      const api = new RestApi(this, 'RestApi', {
        authorizer: authorizer.handler,
        restApiProps: {
          description: 'Handles WENABS api requests.',
          restApiName: 'WENABS API',
        },
      })

      // create REST resources
      const resourceProps = {
        api,
      }
      const accounts = new AccountsResource(this, 'Accounts', resourceProps)
      new BudgetsResource(this, 'Budgets', {
        ...resourceProps,
        accountsFunction: accounts.accountsFunction,
      })
      new GoalsResource(this, 'Goals', {
        ...resourceProps,
        accountsFunction: accounts.accountsFunction,
      })
    }
  }
}
