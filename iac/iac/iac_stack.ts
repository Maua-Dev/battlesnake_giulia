import {
  Stack,
  StackProps,
  Duration,
  CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda_stack';
import { envs as environments } from '../envs';
import { ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';

export class IacStack extends Stack {
  constructor(scope: Construct, constructId: string, props?: StackProps) {
    super(scope, constructId, props);
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
    const repoSlug = environments.REPO_SLUG || (environments.REPO_NAME || 'local').replace(/_/g, '-');
    const prefix = `battlesnake-${repoSlug}`;
    const projectName = environments.PROJECT_NAME || prefix;

    const envs = {
      'STAGE': stage
    };

    const lambdaStack = new LambdaStack(this, envs);

    const alarm = lambdaStack.lambdaFunction.metricInvocations({
      period: Duration.hours(6)
    }).createAlarm(this, `${prefix}-alarm`, {
      alarmName: `${prefix}-alarm-${stageLower}`,
      threshold: 5000,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    })

    const topic = Topic.fromTopicArn(this, `${prefix}Topic`,
      `arn:aws:sns:${environments.AWS_REGION}:${environments.AWS_ACCOUNT_ID}:sns-battlesnake`
    )
    const snsAction = new SnsAction(topic)
    alarm.addAlarmAction(snsAction)
  }
}
