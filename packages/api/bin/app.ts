#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from 'cdk/api-stack'

const app = new cdk.App()

new ApiStack(app, 'Api', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})

app.synth()
