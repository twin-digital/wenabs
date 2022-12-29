import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { SsmSecret } from '@twin-digital/cdk-patterns'
import { ApiResourceProps } from './api-resource-props'
import { LambdaAssets } from '@wenabs/api'
import { NodeLambda } from '../constructs/node-lambda'

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

    const getYnabAccount = new NodeLambda(this, 'getYnabAccount', {
      asset: LambdaAssets.getYnabAccount,
      functionProps: {
        environment: {
          YNAB_TOKEN_PARAMETER: ynabTokenSecret.ssmPath,
        },
      },
    }).lambdaFunction
    getYnabAccount.addToRolePolicy(ynabTokenSecret.readPolicyStatement)

    // TODO: make this generic, for more than one account
    this.accountsFunction = getYnabAccount

    api.addMethod({
      handler: getYnabAccount,
      methodOptions: {
        operationName: 'GetYnabAccount',
      },
      path: ['accounts', 'ynab'],
    })
  }
}
