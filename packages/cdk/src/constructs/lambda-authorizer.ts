import * as lambda from 'aws-cdk-lib/aws-lambda'
import { SsmSecret } from '@twin-digital/cdk-patterns'
import { Construct } from 'constructs'
import { NodeLambda } from './node-lambda'
import { LambdaAssets } from '@wenabs/api'

export class LambdaAuthorizer extends Construct {
  public readonly handler: lambda.Function

  constructor(scope: Construct, id: string) {
    {
      super(scope, id)

      const validAuthToken = new SsmSecret(this, 'ValidAuthToken', {
        ssmPathOptions: {
          component: 'authorizer',
          parameter: 'valid-token',
        },
      })

      this.handler = new NodeLambda(this, 'AuthorizerHandler', {
        asset: LambdaAssets.authorizer,
        functionProps: {
          environment: {
            VALID_TOKEN_PARAMETER: validAuthToken.ssmPath,
          },
        },
      }).lambdaFunction
      this.handler.addToRolePolicy(validAuthToken.readPolicyStatement)
    }
  }
}
