/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cdk from 'aws-cdk-lib'
import { IacStack } from './iac/iac_stack'
import { envs } from './envs'

console.log('Starting the CDK')

const app = new cdk.App()

const awsAccount = envs.AWS_ACCOUNT_ID
const awsRegion = envs.AWS_REGION
const repoSlug = envs.REPO_SLUG || (envs.REPO_NAME || 'local').replace(/_/g, '-')

const tags = {
  'project': 'BattlesnakeNodejs',
  'stack': 'BACK',
  'owner': 'Dev Community Maua'
}

const githubRef = process.env.GITHUB_REF || process.env.GITHUB_REF_NAME || ''

let stage: string
if (githubRef.includes('prod')) {
    stage = 'PROD'
} else if (githubRef.includes('homolog')) {
    stage = 'HOMOLOG'
} else if (githubRef.includes('dev')) {
    stage = 'DEV'
} else {
    stage = 'TEST'
}

const stageLower = stage.toLowerCase()
const stackName = envs.STACK_NAME || `battlesnake-${repoSlug}-${stageLower}`

new IacStack(app, stackName, {
  env: {
    region: awsRegion,
    account: awsAccount
  },
  stackName,
  tags: tags
})

app.synth()
