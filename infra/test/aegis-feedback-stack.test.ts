import test from "node:test";
import assert from "node:assert/strict";
import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { AegisFeedbackStack } from "../lib/aegis-feedback-stack.js";

function template(): Template {
  const app = new cdk.App({ context: { allowedOrigin: "https://demo.example", monthlyBudgetUsd: 5, websiteAssetPath: "../test/fixtures/site" } });
  return Template.fromStack(new AegisFeedbackStack(app, "TestStack"));
}

test("creates a retained, encrypted on-demand feedback table", () => {
  template().hasResourceProperties("AWS::DynamoDB::Table", {
    BillingMode: "PAY_PER_REQUEST",
    SSESpecification: { SSEEnabled: true },
    TimeToLiveSpecification: { AttributeName: "expiresAt", Enabled: true },
    DeletionProtectionEnabled: true,
  });
});

test("exposes only a throttled POST feedback route", () => {
  const stack = template();
  stack.hasResourceProperties("AWS::ApiGatewayV2::Route", {
    RouteKey: "POST /feedback",
  });
  stack.hasResourceProperties("AWS::ApiGatewayV2::Stage", {
    StageName: "$default",
    DefaultRouteSettings: {
      ThrottlingBurstLimit: 20,
      ThrottlingRateLimit: 5,
    },
  });
});

test("limits Lambda concurrency and log retention", () => {
  const stack = template();
  stack.hasResourceProperties("AWS::Lambda::Function", {
    Runtime: "python3.12",
    ReservedConcurrentExecutions: 5,
    Timeout: 5,
    MemorySize: 128,
  });
  stack.hasResourceProperties("AWS::Logs::LogGroup", { RetentionInDays: 7 });
  stack.resourceCountIs("AWS::Budgets::Budget", 0);
  stack.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({ Action: "dynamodb:PutItem", Effect: "Allow" }),
      ]),
    },
  });
});

test("adds a budget only when an alert email is supplied", () => {
  const app = new cdk.App({ context: { allowedOrigin: "https://demo.example", budgetEmail: "owner@example.com", monthlyBudgetUsd: 5, websiteAssetPath: "../test/fixtures/site" } });
  const budgetTemplate = Template.fromStack(new AegisFeedbackStack(app, "BudgetStack"));
  budgetTemplate.hasResourceProperties("AWS::Budgets::Budget", {
    Budget: Match.objectLike({ BudgetLimit: { Amount: 5, Unit: "USD" } }),
  });
  assert.ok(true);
});

test("hosts the static site privately behind CloudFront", () => {
  const stack = template();
  stack.hasResourceProperties("AWS::S3::Bucket", {
    BucketEncryption: { ServerSideEncryptionConfiguration: Match.anyValue() },
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });
  stack.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({ DefaultRootObject: "index.html" }),
  });
});
