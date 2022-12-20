import path from 'node:path'

import * as lambda from 'aws-cdk-lib/aws-lambda'
import { SsmSecret } from '@twin-digital/cdk-patterns'
import { Construct } from 'constructs'

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

      this.handler = new lambda.Function(this, 'AuthorizerHandler', {
        code: lambda.Code.fromAsset(
          path.join(__dirname, '..', '..', '..', 'dist')
        ),
        environment: {
          VALID_TOKEN_PARAMETER: validAuthToken.ssmPath,
        },
        handler: 'authorizer.handler',
        runtime: lambda.Runtime.NODEJS_16_X,
      })
      this.handler.addToRolePolicy(validAuthToken.readPolicyStatement)
    }
  }
}
