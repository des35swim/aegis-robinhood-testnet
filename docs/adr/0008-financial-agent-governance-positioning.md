# ADR 0008: Position Aegis as a financial-agent governance layer

- Status: Accepted for the POC
- Date: 2026-10-01

## Context

The original POC presents Aegis primarily as a governed portfolio experience on Robinhood Chain Testnet. The proposal, deterministic policy result, human review and audit timeline are more generally useful: together they demonstrate a control boundary between probabilistic agent reasoning and consequential financial execution.

The public POC must communicate that broader product direction without claiming that the current deployment contains a production agent runtime, policy service, approval backend, wallet integration or transaction executor.

## Decision

Position Aegis as **the governance layer for financial AI agents**.

The product story is:

1. An AI agent researches and proposes a structured action.
2. Aegis binds trusted identity and context to the proposal.
3. Deterministic policy allows, denies or escalates the action.
4. A human explicitly approves consequential actions when required.
5. A constrained adapter may execute only the approved instruction.
6. Aegis records the proposal, policy decision, approval and outcome as governance evidence.

Robinhood Chain Testnet remains the reference use case, not the product boundary. The current dashboard becomes an interactive demonstration of the governance sequence.

## Truthful presentation boundary

- The currently deployed AWS stack hosts the static application and centrally stores anonymous feedback.
- Portfolio, agent, policy, approval, wallet and transaction behavior remains simulated under ADR 0005.
- Amazon Bedrock AgentCore is described only as a target runtime for a future functional agent path.
- IAM roles are described as configured least-privilege execution roles, not autonomous agent identities.
- CloudTrail and CloudWatch are described as AWS operational telemetry. Aegis must supply its own business-level governance record.
- The POC does not claim to guarantee safety, compliance or regulatory suitability.

## Consequences

- The website opens with the governance narrative rather than portfolio metrics.
- The existing portfolio workspace remains available as a clearly labelled Robinhood Testnet use case.
- Documentation shows current deployed architecture separately from target architecture.
- A later functional spike may connect one AgentCore-hosted agent to a simulated proposal path, but real-money execution remains out of scope until separately authorised.
