import { Construct } from 'constructs'

import { Stack, StackProps } from '@twin-digital/cdk-patterns'
import { Api } from './api'

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, {
      ...props,
      workload: 'wenabs-api',
    })

    new Api(this, 'WenabsApi')
  }
}
