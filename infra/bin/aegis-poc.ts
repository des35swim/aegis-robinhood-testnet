#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AegisFeedbackStack } from "../lib/aegis-feedback-stack.js";

const app = new cdk.App();

new AegisFeedbackStack(app, "AegisFeedbackPoc", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AEGIS_AWS_REGION ?? "ap-southeast-2",
  },
  description: "Minimal anonymous feedback collection for the Aegis testnet POC",
  tags: {
    Project: "Aegis",
    Environment: "poc",
    ManagedBy: "CDK",
  },
});
