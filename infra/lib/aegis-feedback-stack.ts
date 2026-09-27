import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

export class AegisFeedbackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const websiteAssetPath = path.resolve(
      moduleDirectory,
      (this.node.tryGetContext("websiteAssetPath") as string | undefined) ?? "../../web/dist/client",
    );

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const distribution = new cloudfront.Distribution(this, "WebsiteDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
      },
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 404, responsePagePath: "/404.html", ttl: cdk.Duration.minutes(1) },
        { httpStatus: 404, responseHttpStatus: 404, responsePagePath: "/404.html", ttl: cdk.Duration.minutes(1) },
      ],
    });

    const configuredOrigin = this.node.tryGetContext("allowedOrigin") as string | undefined;
    const allowedOrigin = !configuredOrigin || configuredOrigin === "auto"
      ? `https://${distribution.distributionDomainName}`
      : configuredOrigin;
    if (!/^https?:\/\//.test(allowedOrigin)) {
      throw new Error("allowedOrigin must be 'auto' or an explicit http(s) origin");
    }

    const responses = new dynamodb.Table(this, "FeedbackResponses", {
      partitionKey: { name: "responseId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt",
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const feedbackFunction = new lambda.Function(this, "FeedbackWriter", {
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler.handle",
      code: lambda.Code.fromAsset(path.join(moduleDirectory, "../lambda/feedback")),
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      environment: {
        TABLE_NAME: responses.tableName,
        ALLOWED_ORIGIN: allowedOrigin,
        RETENTION_DAYS: "365",
      },
      logGroup: new logs.LogGroup(this, "FeedbackWriterLogs", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    feedbackFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: [responses.tableArn],
    }));

    const api = new apigwv2.HttpApi(this, "FeedbackApi", {
      apiName: "aegis-feedback-poc",
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: [allowedOrigin],
        allowMethods: [apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ["content-type"],
        maxAge: cdk.Duration.hours(1),
      },
    });

    api.addRoutes({
      path: "/feedback",
      methods: [apigwv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration("FeedbackIntegration", feedbackFunction),
    });

    new apigwv2.CfnStage(this, "DefaultStage", {
      apiId: api.apiId,
      stageName: "$default",
      autoDeploy: true,
      defaultRouteSettings: {
        throttlingBurstLimit: 20,
        throttlingRateLimit: 5,
      },
    });

    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3deploy.Source.asset(websiteAssetPath),
        s3deploy.Source.jsonData("runtime-config.json", {
          feedbackApiUrl: `${api.apiEndpoint}/feedback`,
        }),
      ],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
    });

    const budgetEmail = this.node.tryGetContext("budgetEmail") as string | undefined;
    const monthlyBudgetUsd = Number(this.node.tryGetContext("monthlyBudgetUsd") ?? 5);
    if (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd <= 0) {
      throw new Error("monthlyBudgetUsd must be a positive number");
    }
    if (budgetEmail) {
      new budgets.CfnBudget(this, "MonthlyCostBudget", {
        budget: {
          budgetName: "aegis-poc-monthly-cost",
          budgetType: "COST",
          timeUnit: "MONTHLY",
          budgetLimit: { amount: monthlyBudgetUsd, unit: "USD" },
        },
        notificationsWithSubscribers: [
          {
            notification: {
              notificationType: "FORECASTED",
              comparisonOperator: "GREATER_THAN",
              threshold: 80,
              thresholdType: "PERCENTAGE",
            },
            subscribers: [{ subscriptionType: "EMAIL", address: budgetEmail }],
          },
          {
            notification: {
              notificationType: "ACTUAL",
              comparisonOperator: "GREATER_THAN",
              threshold: 100,
              thresholdType: "PERCENTAGE",
            },
            subscribers: [{ subscriptionType: "EMAIL", address: budgetEmail }],
          },
        ],
      });
    }

    new cdk.CfnOutput(this, "FeedbackApiUrl", {
      value: `${api.apiEndpoint}/feedback`,
      description: "Set this as NEXT_PUBLIC_FEEDBACK_API_URL when building the website",
    });
    new cdk.CfnOutput(this, "FeedbackTableName", { value: responses.tableName });
    new cdk.CfnOutput(this, "WebsiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Public CloudFront URL for the Aegis POC",
    });
  }
}
