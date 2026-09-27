# Aegis POC AWS infrastructure

This CDK application prepares the smallest AWS footprint needed to host the static website and collect anonymous product-feedback responses. It does **not** deploy AgentCore, Bedrock, a trading backend or blockchain contracts.

## Resources

- Private S3 website bucket served only through CloudFront Origin Access Control
- CloudFront HTTPS distribution with security headers
- API Gateway HTTP API with only `POST /feedback`
- Python 3.12 Lambda writer with five reserved concurrent executions
- DynamoDB on-demand table with encryption, deletion protection and one-year TTL
- Seven-day Lambda log retention
- Optional monthly AWS Budget alerts

The browser-generated response ID lets one browser update its response. The API stores no wallet address, email address or user identity. API Gateway or AWS service logs may still contain normal network metadata; the application does not intentionally persist it.

## Local review

```bash
cd web
npm run build

cd infra
npm install
npm test
npm run synth
```

The default `allowedOrigin=auto` binds feedback CORS to the generated CloudFront hostname. Before deployment, supply a real budget-alert address:

```bash
npx cdk synth \
  -c budgetEmail=owner@example.com \
  -c monthlyBudgetUsd=5
```

Do not place AWS access keys in this repository. Use AWS IAM Identity Center, an approved CLI profile, or another short-lived credential mechanism. Deployment is a separate, explicitly reviewed step.
