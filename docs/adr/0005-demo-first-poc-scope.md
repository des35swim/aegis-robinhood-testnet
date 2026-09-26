# ADR 0005: Demo-first POC scope

- Status: Accepted for the POC
- Date: 2026-09-25
- Accepted by project owner: 2026-09-25

## Context

The original build specification describes a production-shaped, multi-phase AWS and blockchain implementation. The immediate objective is instead a persuasive proof of concept: a modern, intuitive demonstration that communicates the governance experience without spending disproportionate effort on infrastructure that is not needed to evaluate the idea.

The POC must remain truthful. Simulated data and state transitions may look realistic, but the interface must not imply that a simulated policy decision, quote, approval, or transaction occurred onchain or in a deployed AWS control plane.

## Decision

Replace the infrastructure-heavy Phase 1 with a **frontend-first interactive demonstration**.

Implement now:

- a polished, responsive portfolio workspace;
- an agent-guided mock-asset proposal journey;
- convincing allowed and denied policy scenarios;
- an interactive human-review surface and audit timeline;
- persistent, visible `Demo mode`, `Mock asset`, and `Simulated` disclosures;
- deterministic fixtures so the demonstration is reliable;
- optionally, read-only wallet connection and genuine Robinhood Testnet chain, block, and balance reads where they improve credibility without exposing credentials.

Simulate for the POC:

- portfolio holdings and performance;
- asset prices, research signals, confidence, and provenance records;
- agent reasoning summaries;
- policy evaluation results;
- quotes, proposals, approval state, and audit events;
- transaction progress and finality, if shown.

Defer:

- Cognito and multi-user identity;
- AgentCore Gateway, Runtime, Policy, and Memory deployment;
- Lambda, DynamoDB, VPC, IAM, and production observability;
- mock-token, feed, settlement, and exchange contracts;
- transaction construction, signing, broadcasting, and receipt verification;
- production persistence, reconciliation, and operational hardening.

## Non-negotiable presentation rules

- Never describe a simulated transaction as submitted, mined, settled, or confirmed without an adjacent simulation label.
- Never request a private key or recovery phrase.
- Never expose the credentialed RPC URL to browser code.
- Never use real funds or mainnet transaction functionality.
- Keep the original architecture documents as the roadmap for any later genuine implementation; this ADR changes POC scope, not the security requirements for production.

## Consequences

- Most effort moves to visual design, interaction quality, responsive behavior, and a repeatable demo narrative.
- The POC can be reviewed locally without an AWS account or funded test wallet.
- The POC demonstrates the intended user experience and control concepts, not a completed AWS or blockchain implementation.
- Any future move from simulation to real execution must explicitly re-authorize the deferred phases and satisfy ADRs 0001–0004.
