import path from 'node:path'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

import { SsmSecret } from '../constructs/ssm-secret'
import { MethodOptions } from 'aws-cdk-lib/aws-apigateway'

export type AccountsApiProps = {
  /** ID of the RestApi (API gateway) to register resources with */
  restApiId: string
}

export type AddMethodOptions = {
  /** Indicates whether authorization is required or not (Default: true) */
  authorizationRequired?: boolean

  /** Lambda function which handles calls to this method */
  handler: lambda.Function

  /** HTTP method (default: GET) */
  method?: string

  /** Optional additional options to apply to the method */
  methodOptions?: Omit<MethodOptions, 'authorizer' | 'authorizationType'>

  /**
   * URL path of the method, represented as an array of path components
   * TODO: just take a string and split on '/'
   */
  path: string[]
}

/**
 * An API gateway REST API.
 */
export class RestApi extends Construct {
  /** The underlying apigateway.RestApi construct */
  public readonly api: apigateway.RestApi

  /** Authorizer to use if a method is added that requires authorization. */
  private readonly _authorizer: apigateway.IAuthorizer

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const validAuthToken = new SsmSecret(this, 'ValidAuthToken', {
      ssmPathOptions: {
        component: 'authorizer',
        parameter: 'valid-token',
      },
    })

    const authorizerHandler = new lambda.Function(this, 'AuthorizerHandler', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', '..', 'dist')
      ),
      environment: {
        VALID_TOKEN_PARAMETER: validAuthToken.ssmPath,
      },
      handler: 'authorizer.handler',
      runtime: lambda.Runtime.NODEJS_16_X,
    })
    authorizerHandler.addToRolePolicy(validAuthToken.readPolicyStatement)

    this._authorizer = new apigateway.TokenAuthorizer(this, 'Authorizer', {
      handler: authorizerHandler,
    })

    this.api = new apigateway.RestApi(this, 'RestApi', {
      description: 'Handles WENABS api requests.',
      restApiName: 'WENABS API',
    })
    this.api.root.addMethod('ANY')
  }

  private _getResource(
    resource: apigateway.IResource,
    path: string[]
  ): apigateway.IResource {
    if (path.length === 0) {
      return resource
    }

    const existingResource = resource.getResource(path[0])
    return this._getResource(
      existingResource ?? resource.addResource(path[0]),
      path.slice(1)
    )
  }

  public addMethod({
    authorizationRequired = true,
    handler,
    method = 'GET',
    methodOptions = {},
    path,
  }: AddMethodOptions): apigateway.Method {
    const resource = this._getResource(this.api.root, path)
    return resource.addMethod(
      method,
      new apigateway.LambdaIntegration(handler),
      {
        ...methodOptions,
        ...(authorizationRequired ? { authorizer: this._authorizer } : {}),
      }
    )
  }
}
