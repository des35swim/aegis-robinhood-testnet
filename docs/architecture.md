# Target financial-agent governance architecture

Status: target product architecture; not deployed by the current POC

![Aegis target governance architecture](architecture/aegis-target-governance.svg)

The editable source is available at [`architecture/aegis-target-governance.drawio`](architecture/aegis-target-governance.drawio).

```text
Browser UI
  |-- Cognito/OIDC JWT --> AgentCore Ingress Gateway (target)
  |                         `--> AgentCore Runtime (orchestration only)
  |                                `--> AgentCore Tool Gateway
  |                                      |-- read adapters
  |                                      |-- proposal + risk service
  |                                      `-- execution preparation
  |
  |-- authenticated human API --> approval/rejection + tx-hash reporting
  `-- injected wallet ----------> Robinhood Chain Testnet

Tool/human services --> DynamoDB authoritative state + immutable events
External adapters ---> approved RPC, registry, price/feed, quote/venue
All layers ---------> correlated sanitized telemetry
```

The current deployed architecture is deliberately smaller: CloudFront and S3 host the static site, while API Gateway, Lambda and DynamoDB store anonymous feedback. See the [repository README](../README.md#current-deployed-aws-architecture) for that diagram and resource inventory.

## Boundary rules

- Runtime is an untrusted planner and cannot reach signing material, authoritative tables, or blockchain write RPC.
- Human approval endpoints are not model tools.
- Tool inputs never carry authoritative actor, tenant, or wallet identity.
- The executor accepts a stored proposal ID and returns only its canonical prepared payload.
- The browser wallet is the signing boundary; the backend verifies the resulting onchain transaction independently.
- AgentCore Policy controls principal/tool/static/temporal properties expressible at Gateway. The deterministic risk service and DynamoDB control all stateful financial rules.

See ADRs 0001–0004 for decisions and `docs/threat-model.md` for trust assumptions.
