import path from 'node:path'

import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

import type { ApiResourceProps } from './api-resource-props'

import { SsmSecret } from '../constructs/ssm-secret'

/**
 * Root construct of the WENABS API.
 */
export class AccountsResource extends Construct {
  public readonly accountsFunction: lambda.Function

  constructor(scope: Construct, id: string, { api }: ApiResourceProps) {
    super(scope, id)

    const ynabTokenSecret = new SsmSecret(this, 'YnabToken', {
      ssmPathOptions: {
        component: 'ynab',
        parameter: 'token',
      },
    })

    const ynabHandler = new lambda.Function(this, 'YnabHandler', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', '..', 'dist')
      ),
      environment: {
        YNAB_TOKEN_PARAMETER: ynabTokenSecret.ssmPath,
      },
      handler: 'accounts.ynabHandler',
      runtime: lambda.Runtime.NODEJS_16_X,
    })
    ynabHandler.addToRolePolicy(ynabTokenSecret.readPolicyStatement)

    // TODO: make this generic, for more than one account
    this.accountsFunction = ynabHandler

    api.addMethod({
      handler: ynabHandler,
      methodOptions: {
        operationName: 'GetYnabAccount',
      },
      path: ['accounts', 'ynab'],
    })
  }
}
