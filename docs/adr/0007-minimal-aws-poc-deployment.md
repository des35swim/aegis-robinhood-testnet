# ADR 0007: Minimal AWS POC deployment

- Status: Accepted for local preparation; deployment pending account selection
- Date: 2026-09-27

## Context

The frontend-first POC needs a public AWS-hosted URL and central feedback collection without implementing the production-shaped AgentCore architecture deferred by ADR 0005.

## Decision

Prepare one CDK stack in `ap-southeast-2` containing:

- a private, encrypted S3 bucket;
- a CloudFront distribution using Origin Access Control;
- an API Gateway HTTP API exposing only `POST /feedback`;
- a Python 3.12 Lambda behind API Gateway request throttling;
- an encrypted DynamoDB on-demand table with deletion protection and a one-year TTL;
- seven-day Lambda log retention; and
- optional USD 5 monthly budget notifications when an owner email is supplied.

The static website reads a generated, non-secret `/runtime-config.json` containing the feedback endpoint. Visitors receive a browser-generated UUID so a later vote from the same browser replaces the earlier response. The application intentionally collects no email, wallet address or authenticated identity.

AWS and normal network infrastructure may retain operational metadata independently of the application record. This is a low-volume concept-research system, not an anonymous communications service.

## Consequences

- The public site and feedback collection will be real AWS services once deployed.
- Portfolio, agent, policy, approval, wallet and blockchain interactions remain explicitly simulated.
- The DynamoDB table and website bucket are retained if the stack is deleted, preventing accidental data loss but requiring deliberate cleanup if the POC is retired.
- CloudFront's default hostname is used initially. A custom domain and ACM certificate are separate optional work.
- Deployment requires an explicitly selected non-production AWS account/profile and a budget notification address.
