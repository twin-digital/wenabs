import { Construct } from 'constructs'

import { RestApi } from './constructs/rest-api'
import { AccountsResource } from './api-resources/accounts-resource'
import { GoalsResource } from './api-resources/goals-resource'

/**
 * Root construct of the WENABS API.
 */
export class Api extends Construct {
  constructor(scope: Construct, id: string) {
    {
      super(scope, id)

      // create API gateway rest api
      const api = new RestApi(this, 'RestApi')

      // create REST resources
      const resourceProps = {
        api,
      }
      const accounts = new AccountsResource(this, 'Accounts', resourceProps)
      new GoalsResource(this, 'Goals', {
        ...resourceProps,
        accountsFunction: accounts.accountsFunction,
      })
    }
  }
}
