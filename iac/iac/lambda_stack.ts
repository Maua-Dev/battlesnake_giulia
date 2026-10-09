import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import * as path from 'path';
import { envs } from '../envs';

export class LambdaStack extends Construct {
  public readonly lambdaFunction: lambda.Function;
  nodeModulesLayer: lambda.LayerVersion;

  constructor(scope: Construct, environmentVariables: Record<string, any>) {
    const repoSlug = envs.REPO_SLUG || (envs.REPO_NAME || 'local').replace(/_/g, '-');
    const prefix = `battlesnake-${repoSlug}`;
    super(scope, `${prefix}-lambda-construct`);

    const githubRef = process.env.GITHUB_REF || process.env.GITHUB_REF_NAME || '';

    let stage: string;
    if (githubRef.includes('prod')) {
        stage = 'PROD';
    } else if (githubRef.includes('homolog')) {
        stage = 'HOMOLOG';
    } else if (githubRef.includes('dev')) {
        stage = 'DEV';
    } else {
        stage = 'TEST';
    }

    const stageLower = stage.toLowerCase();
    const projectName = envs.PROJECT_NAME || prefix;
    const accountId = envs.AWS_ACCOUNT_ID;
    const boundaryArn = `arn:aws:iam::${accountId}:policy/pb-battlesnake-participant`;

    const lambdaRole = new iam.Role(this, `${prefix}-role`, {
      roleName: `${prefix}-role-${stageLower}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        'BattlesnakeBoundary',
        boundaryArn,
      ),
    });

    this.nodeModulesLayer = new lambda.LayerVersion(this, `${prefix}-layer`, {
      layerVersionName: `${prefix}-layer-${stageLower}`,
      code: lambda.Code.fromAsset(path.join(__dirname, `../dependencies`)),
      compatibleRuntimes: [lambda.Runtime.NODEJS_24_X],
      description: 'Node modules layer for Battlesnake Nodejs'
    });

    this.lambdaFunction = new lambda.Function(this, `${prefix}-lambda`, {
      functionName: `${prefix}-lambda-${stageLower}`,
      code: lambda.Code.fromAsset(path.join(__dirname, `../../dist`)),
      handler: `index.handler`,
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: environmentVariables,
      layers: [this.nodeModulesLayer],
      role: lambdaRole,
      timeout: Duration.seconds(30),
      memorySize: 512
    });

    const lambdaUrl = this.lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    new CfnOutput(this, `${prefix}UrlValue`, {
      value: lambdaUrl.url,
      exportName: projectName + 'UrlValue'
    });
  }
}
