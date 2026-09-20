# Governed RWA Agent on AWS — Prototype Build Specification

## 1. Purpose

Build an open-source, end-to-end prototype demonstrating how an AI agent running on AWS can discover, analyse, propose, approve, and execute a transaction involving a Robinhood Stock Token or a clearly labelled test substitute.

The differentiator is not autonomous trading or an association with AWS, Amazon, Robinhood, or NVIDIA. The differentiator is a credible AWS-native control plane for agent identity, tool authorization, deterministic financial policy, human approval, wallet isolation, and auditability.

This document is an implementation brief for Codex. Treat every requirement containing **MUST** or **MUST NOT** as mandatory unless Phase 0 proves it technically impossible. Record any resulting deviation in an Architecture Decision Record (ADR) before implementing the alternative.

## 2. Prototype outcome

The finished prototype must demonstrate this workflow:

1. An authenticated user asks the agent to inspect a supported portfolio and propose a transaction.
2. The agent discovers approved assets and obtains current portfolio, price, trading-status, and quote data through read-only tools.
3. The agent calls a proposal tool with structured intent; it never supplies or handles private keys.
4. A deterministic risk service independently evaluates the proposal.
5. Requests outside policy are denied with an auditable reason.
6. Requests inside policy are stored as immutable, expiring transaction proposals.
7. Transactions over the configured approval threshold require explicit application-level human approval. Transactions at or below the threshold may be approved automatically by policy, but user-wallet authorization, when applicable, remains a separate mandatory action.
8. Application approval and wallet authorization are distinct events. Each is bound to the exact transaction payload and authenticated user.
9. An execution component validates the applicable approval and authorization again, claims the stored proposal at most once, and submits only its canonical transaction.
10. The system records the model decision, tool calls, policy results, approval, transaction hash, and final receipt using a shared correlation ID.

The preferred demonstration asset is AMZN. AMZN MUST NOT be hard-coded into the architecture or policy model. Asset identifiers, contract addresses, price feeds, trading status, and approved venues must come from a versioned registry.

## 3. Safety and positioning

### 3.1 Prototype classification

V1 is a testnet or simulated-value prototype. It MUST NOT use real customer funds or represent itself as production-ready.

If Robinhood Chain Testnet provides canonical Stock Tokens, suitable price feeds, and usable liquidity, use those components. If it does not, deploy clearly labelled mock ERC-20 Stock Token and exchange contracts on Robinhood Chain Testnet. The UI and documentation must visibly identify mock assets.

### 3.2 Terminology

Robinhood Stock Tokens are tokenised debt securities providing economic exposure to an underlying instrument; they are not ownership of the underlying shares. Do not describe them as Amazon shares, AWS coins, official Amazon tokens, or an AWS/Robinhood product.

Do not imply endorsement, sponsorship, or partnership by AWS, Amazon, Robinhood, NVIDIA, Chainlink, or any wallet or liquidity provider. Use trademarks only as necessary to identify compatible technology and follow applicable brand guidelines.

### 3.3 Non-goals

V1 MUST NOT include:

- Mainnet or real-value execution.
- Custody of real customer funds.
- Unattended or scheduled trading.
- Investment recommendations presented as financial advice.
- Yield, leverage, borrowing, lending, derivatives, bridging, or cross-chain execution.
- Direct minting or redemption with a Stock Token issuer.
- An agent-controlled unrestricted wallet.
- Secrets, private keys, raw signing material, or RPC credentials in prompts, memory, browser storage, source control, or logs.
- NVIDIA cuOpt or other portfolio optimizers. Preserve extension points for them, but do not implement them in V1.
- AgentCore Payments as the presumed signer for arbitrary swaps. It may be demonstrated separately for supported x402/MPP payments only.

## 4. Required Phase 0: feasibility and architecture spike

Do not build the complete application until Phase 0 is finished. Read current primary documentation rather than relying on this specification for facts that may have changed.

### 4.1 Verify AWS capabilities

Confirm and document:

- Required AgentCore services and SDK versions.
- Region availability for Runtime, Identity, Gateway, Policy, Memory, and Observability.
- Supported Gateway inbound authentication and workload identity propagation.
- How Runtime invocation can be restricted so Gateway policy cannot be bypassed.
- Current Cedar/Dogwood schema, numeric precision, temporal-policy behaviour, quotas, and logging support.
- Gateway outbound authentication options for external APIs.
- AgentCore Runtime networking and egress-control options.
- Current AgentCore Payments protocols, supported assets/networks, wallet permissions, and limitations. Explicitly determine whether it can or cannot sign the selected Robinhood Chain transaction type.

### 4.2 Verify Robinhood Chain capabilities

Confirm and document:

- Mainnet and testnet chain IDs and RPC endpoints.
- Whether canonical AMZN and at least one other Stock Token exist on testnet.
- Canonical asset registry and contract-verification method.
- Relevant ERC-20 and ERC-8056 behaviour.
- Testnet price-feed availability and staleness/sequencer checks.
- Testnet liquidity and a supported execution route: RFQ, AMM, proprietary AMM, or mock exchange.
- How quotes are authenticated and how replay/expiry is handled.
- Wallet-provider compatibility with Robinhood Chain Testnet.
- Gas token and faucet availability.
- Trading-status, corporate-action multiplier, transfer, jurisdiction, and eligibility considerations.

### 4.3 Required Phase 0 artefacts

Create:

- `docs/feasibility-report.md`
- `docs/threat-model.md`
- `docs/adr/0001-transaction-execution-path.md`
- `docs/adr/0002-wallet-and-signing-model.md`
- `docs/adr/0003-test-assets-and-liquidity.md`
- `docs/adr/0004-agentcore-service-boundaries.md`
- A small executable connectivity probe under `spikes/` that reads chain ID, latest block, approved asset metadata, balance, price/feed status, and quote availability without sending a transaction.

The balance probe must use a documented, externally supplied public test address. Phase 0 must not create, fund, or require custody of a wallet merely to satisfy the probe.

The threat model must explicitly assess CSRF and clickjacking on approval endpoints; wallet account and network switching; malicious or deceptive token metadata; non-standard, fee-on-transfer, callback, and re-entrant token behaviour; quote/RFQ signer authentication and domain separation; MEV or front-running where relevant; chain reorganizations and finality; address normalization; approval or quote expiry during signing; and denial-of-service through proposal creation, tool calls, or model cost exhaustion. Controls may be marked not applicable only with a written rationale.

Every factual claim in the feasibility report must link to current primary documentation or verifiable onchain evidence. Include the date checked.

### 4.4 Go/no-go decisions

Phase 0 must select one execution mode:

1. **Canonical testnet mode:** canonical test asset, feed, and supported liquidity route are all usable.
2. **Mock testnet mode:** Robinhood Chain Testnet is usable but canonical test assets or liquidity are not; deploy labelled mock contracts.
3. **Local simulation mode:** testnet itself is blocked; use a local EVM chain while keeping provider interfaces intact. Clearly state that Robinhood integration remains unproven.

Do not silently substitute one mode for another. Record the decision in ADR 0003 and surface it in the UI.

Phase 0 is complete only when its evidence matrix records **pass**, **fail**, or **not available** for every item in sections 4.1 and 4.2 and identifies the evidence used. The selected mode must satisfy all of its following entry criteria:

- **Canonical testnet mode:** verified chain connection, canonical test asset contracts, usable price/feed checks, authenticated or independently verifiable quotes, usable liquidity, compatible wallet, gas availability, and a read-only probe passing against those components.
- **Mock testnet mode:** verified Robinhood Chain Testnet connection, deployability and wallet compatibility, gas availability, a documented mock asset/feed/exchange design, and a read-only probe passing for all real components available before mock deployment.
- **Local simulation mode:** documented evidence that testnet access or essential testnet infrastructure is blocked, provider interfaces that do not assume the local chain, and a passing local read-only probe.

Any unknown that affects signing authority, transaction construction, quote integrity, or policy enforcement is a no-go for Phase 1 until explicitly resolved or isolated behind the selected mock/local mode.

## 5. Proposed architecture

```text
Browser application
  |
  | Cognito/OIDC authenticated request
  v
AgentCore Gateway (agent ingress)
  |-- inbound authentication
  |-- default-deny policy
  |-- request/response controls
  v
AgentCore Runtime
  |-- Bedrock model
  |-- orchestration only
  |-- no signing keys or unrestricted RPC credentials
  |
  v
AgentCore Gateway (tool boundary)
  |-- read tools
  |-- proposal tool
  |-- approval-status tool
  `-- execution tool
       |
       +--> Asset/price/portfolio adapters (read only)
       +--> Deterministic risk service
       +--> Proposal and approval store
       `--> Isolated transaction executor or user wallet
                    |
                    v
             Robinhood Chain Testnet

Telemetry from every layer
  --> ADOT / AgentCore Observability
  --> CloudWatch Logs and metrics
  --> AWS X-Ray traces where supported
  --> CloudTrail for AWS control-plane activity
```

It is acceptable to use one physical Gateway if current service constraints make separate ingress and tool Gateways unnecessarily complex. Maintain logical separation and explain the decision in ADR 0004.

## 6. Trust boundaries and invariants

The language model is untrusted for authorization and arithmetic. Model output is a proposal, never authority.

The following invariants MUST hold:

- Every state-changing operation passes through the governed tool boundary.
- Runtime cannot directly invoke the transaction signer or unrestricted blockchain RPC write methods.
- The authenticated user identity is derived server-side. The model and client cannot select another `userId`, wallet, tenant, or policy session.
- All write actions are default-denied unless specifically permitted.
- The execution component accepts a stored proposal ID, not free-form transaction calldata from the model.
- Approval is bound to the authenticated user and the exact canonical transaction hash.
- A proposal can execute no more than once.
- An expired quote, proposal, approval, or changed payload cannot execute.
- Risk and authorization are re-evaluated immediately before execution.
- Contract address, function selector, chain ID, spender, recipient, asset, and quote venue are allowlisted.
- A model prompt, memory item, remote webpage, token metadata, or tool response cannot grant permissions.
- Failure must be safe: ambiguity, stale data, missing state, RPC disagreement, or policy-service failure results in denial.

## 7. Technology defaults

Use these defaults unless Phase 0 documents a concrete incompatibility:

- Python 3.12 for the AgentCore agent, deterministic services, and Lambda tools.
- TypeScript and AWS CDK v2 for infrastructure.
- React with TypeScript for a minimal demonstration and approval UI.
- Amazon Cognito or a standards-based OIDC provider supported by AgentCore Gateway for user authentication.
- Amazon DynamoDB for portfolio snapshots, proposals, approvals, idempotency records, and transaction state.
- AWS Secrets Manager for third-party credentials.
- AWS KMS customer-managed keys for sensitive application data and supported AgentCore resources.
- AgentCore Runtime for agent execution.
- AgentCore Gateway and Policy for the governed tool boundary.
- AgentCore Memory for short-term conversational continuity only.
- Amazon Bedrock for model inference.
- ADOT, CloudWatch, X-Ray where supported, and CloudTrail for observability.
- `pytest`, CDK assertions, and frontend unit tests in CI.

Pin dependencies and runtime versions. Commit lockfiles. Infrastructure must be reproducible from a clean AWS account after prerequisites are satisfied.

## 8. Domain model

Use integer base units for tokens and money. Never use binary floating-point for currency, token amounts, prices, ratios, or percentages.

### 8.1 Asset registry entry

At minimum:

- Internal immutable asset ID.
- Display symbol and name.
- Environment/mode.
- Chain ID.
- Canonical token contract address.
- Token decimals.
- ERC-8056 support and multiplier method.
- Price-feed contract/address or approved price adapter.
- Price decimals and maximum age.
- Approved trading venue and contract addresses.
- Allowed transaction selectors.
- Trading status.
- Enabled/disabled state.
- Registry version and source evidence.

Symbols are display values and MUST NOT be used as authoritative identifiers.

### 8.2 Transaction proposal

At minimum:

- Random proposal ID.
- Correlation ID and policy-session ID.
- Authenticated actor/tenant ID.
- Wallet address.
- Immutable payload-record version and payload-hash algorithm version.
- Intent: buy or sell.
- Input and output asset IDs and contract addresses.
- Integer input amount, minimum output, and displayed notional.
- Quote source, quote ID, quote timestamp, and expiry.
- Chain ID, target contract, value, calldata, and calldata hash.
- Expected price, maximum slippage, gas policy, and nonce strategy.
- Pre-trade portfolio snapshot/version.
- Risk-policy version and complete decision reasons.
- Status and state-transition timestamps.
- Expiry and time-to-live.
- Approval requirement.

Persist the canonical proposal payload as an immutable record. Store lifecycle state separately using a monotonically increasing version and conditional writes, and append an immutable event for every attempted or successful transition. A re-quote, nonce assignment that changes the signed payload, registry change affecting execution, or any other payload change creates a new proposal; it must never mutate an approved payload.

Canonical payload hashing must use a documented deterministic encoding rather than JSON serialization. The hash preimage must be domain-separated for this application and environment and bind, at minimum, the proposal ID, payload schema version, actor/tenant, wallet, chain ID, sender, nonce or nonce constraint, target, value, calldata, gas constraints, asset and venue identifiers, quote ID and expiry, registry version, and policy version. Address normalization and integer encoding must be specified and covered by cross-language test vectors.

### 8.3 State machine

Use conditional writes to enforce transitions:

```text
DRAFT -> POLICY_DENIED
DRAFT -> PENDING_APPROVAL
DRAFT -> APPROVED              only when application approval is not required
PENDING_APPROVAL -> APPROVED   exact-payload approval
PENDING_APPROVAL -> REJECTED
PENDING_APPROVAL -> EXPIRED
APPROVED -> AWAITING_SIGNATURE user-signed mode
APPROVED -> EXECUTING          managed-signer mode
APPROVED -> INVALIDATED
APPROVED -> EXPIRED
AWAITING_SIGNATURE -> SUBMITTED
AWAITING_SIGNATURE -> SIGNED
AWAITING_SIGNATURE -> REJECTED
AWAITING_SIGNATURE -> INVALIDATED
AWAITING_SIGNATURE -> EXPIRED
SIGNED -> EXECUTING
EXECUTING -> SUBMITTED
EXECUTING -> SUBMISSION_UNKNOWN
SUBMISSION_UNKNOWN -> SUBMITTED
SUBMISSION_UNKNOWN -> FAILED   only after reconciliation proves non-submission
SUBMITTED -> MINED
SUBMITTED -> REVERTED
SUBMITTED -> DROPPED
MINED -> CONFIRMED             after the configured finality depth
MINED -> REORGED
REORGED -> SUBMITTED
EXECUTING -> FAILED
```

`POLICY_DENIED`, `REJECTED`, `INVALIDATED`, `EXPIRED`, `CONFIRMED`, `REVERTED`, `DROPPED`, and `FAILED` are terminal. No terminal state may return to an executable state. Use idempotency keys and DynamoDB conditional expressions to prevent duplicate claims. Treat RPC timeout or an ambiguous broadcast response as `SUBMISSION_UNKNOWN`; reconcile by signed-transaction hash and nonce and never construct or sign a replacement payload under the same proposal.

In wallet-broadcast mode, `AWAITING_SIGNATURE -> SUBMITTED` occurs only after the backend verifies the onchain transaction matches the canonical payload. In backend-broadcast mode, `AWAITING_SIGNATURE -> SIGNED -> EXECUTING` occurs only after the backend validates the signed bytes against that payload. Phase 0 ADRs may refine mode-specific states, but they must preserve these safety properties and explicitly define wallet rejection, receipt timeout, dropped transactions, replacement detection, required confirmation depth, and chain reorganization handling.

## 9. Tool contracts

Expose small, typed tools. Generate Gateway schemas from explicit models and validate again inside every target.

### 9.1 Read-only tools

- `list_approved_assets()`
- `get_asset_details(asset_id)`
- `get_my_portfolio()`
- `get_asset_price(asset_id)`
- `get_trading_status(asset_id)`
- `get_quote(input_asset_id, output_asset_id, input_amount)`
- `get_proposal(proposal_id)`

Read tools must distinguish unavailable, stale, unverified, and valid data. They must not fabricate fallbacks. Actor, tenant, and wallet scope must come from verified server-side context; possession of a wallet ID or proposal ID is never authorization.

### 9.2 Proposal tool

`propose_transaction(intent, input_asset_id, output_asset_id, input_amount, max_slippage_bps)`

The service, not the agent, must:

- Resolve contract addresses from the approved registry.
- Obtain and validate the quote.
- Fetch a fresh portfolio snapshot and price data.
- Construct or validate canonical transaction data.
- Evaluate risk.
- Decide whether approval is required.
- Persist the proposal and return a safe human-readable summary.

### 9.3 Human-control-plane approval operations

Approval and rejection must be performed through an authenticated application endpoint, not by interpreting conversational statements such as “yes” or “go ahead.”

- `approve_proposal(proposal_id, expected_payload_hash)`
- `reject_proposal(proposal_id, expected_payload_hash)`

Require reauthentication or a deliberate confirmation interaction appropriate to the chosen auth system. Store actor ID, timestamp, proposal hash, policy version, and approval method. An approval token or record must be short-lived, single-use, and scoped to one proposal.

These operations are human-control-plane APIs. They MUST NOT be registered as model-facing tools or made callable by AgentCore Runtime. Application approval is distinct from wallet authorization: the former attests that policy-required human review occurred; the latter authorizes the blockchain transaction. The audit trail must record both when both are required.

### 9.4 Execution tool

`execute_approved_proposal(proposal_id)`

The execution path must load canonical data from storage, revalidate every invariant, atomically claim the proposal at most once, and persist the transaction hash and receipt. It must not accept arbitrary calldata, recipient, chain, wallet, or amount fields. "Exactly once" means one successful application-level execution claim plus idempotent submission or rebroadcast of the identical signed transaction; it does not assume that an RPC response proves whether a blockchain submission occurred.

## 10. Policy requirements

Initial configurable demonstration policy:

- Only approved asset IDs and contract addresses may be used.
- Maximum transaction notional: USD 500.00.
- Transactions above USD 250.00 require explicit application-level human approval.
- Maximum post-trade exposure to one asset: 20% of portfolio value.
- Maximum quote age: configurable, with a safe default documented after Phase 0.
- Maximum slippage: configurable in integer basis points.
- Only the selected test chain, venue contracts, and function selectors are allowed.
- No token approval may be unlimited; allowances must be exact or tightly bounded and revocable.
- No transfer to arbitrary recipients.
- Deny execution if price, sequencer, trading status, portfolio, policy, or approval data is unavailable or stale.

Threshold semantics and arithmetic are normative:

- Notional strictly greater than USD 250.00 requires application approval; exactly USD 250.00 does not.
- Notional strictly greater than USD 500.00 is denied; exactly USD 500.00 is allowed if every other rule passes.
- USD values use integer minor units at a documented scale. Conversion and division round conservatively against the proposed transaction: maximum-notional and concentration calculations round upward, while minimum received value rounds downward.
- Portfolio value includes only registry-approved, positively priced holdings plus the approved settlement asset; gas balances and unknown/unpriced assets do not increase the denominator.
- Post-trade exposure is calculated for buys and sells from the fresh pre-trade snapshot, conservative execution bounds, and all live pending reservations for that actor and wallet.
- Creation must atomically reserve pending exposure, and every terminal transition must release it idempotently. A missing or zero denominator, unavailable price, or inconsistent corporate-action multiplier results in denial.
- The multiplier and price versions used in valuation must be mutually compatible and bound to the proposal. A material update before execution invalidates the proposal rather than mutating it.

Implement this in layers:

1. AgentCore Policy/Cedar for principal, tool, static allowlists, request limits, sequencing, and other properties expressible from trusted Gateway context.
2. A deterministic risk service for portfolio concentration, valuation, quote freshness, pending exposure, and stateful rules.
3. Executor/wallet controls for chain, target, selector, amount, allowance, expiry, nonce, and one-time execution.

Do not claim a control is enforced by AgentCore Policy unless a test proves that enforcement occurs outside the agent process. Where Cedar numeric precision is insufficient, use integer minor units or perform the rule in the risk service.

## 11. Identity and authorization

- Authenticate users at the Gateway boundary using JWT/OIDC or IAM as supported by the selected architecture.
- Preserve caller identity and policy-session identity through the Gateway-to-Runtime-to-Gateway path.
- Derive actor and tenant identifiers from verified claims, never request bodies.
- Scope DynamoDB access by service role and application checks; one user must never access another user's proposals or wallet.
- Use distinct least-privilege IAM roles for deployment, Runtime, read tools, proposal service, approval service, and executor.
- Restrict direct Runtime invocation to the intended Gateway where supported.
- Restrict executor invocation to the governed execution path.
- Apply short session lifetimes and explicit revocation where supported.
- Run IAM Access Analyzer and CDK security checks in CI.

## 12. Wallet and signing

Preferred V1 mode: user-signed testnet transactions where the browser wallet displays the exact payload and the backend verifies it matches the approved proposal. ADR 0001 and ADR 0002 must choose exactly one submission flow: (a) the wallet signs and broadcasts while the backend verifies and tracks it, (b) the wallet signs and the backend broadcasts the exact signed bytes, or (c) an isolated managed signer signs and broadcasts after application approval. The implementation and terminology must not combine these flows.

In a user-signed flow, wallet authorization is required for every transaction regardless of the USD 250 application-approval threshold. Network switching, account switching, user rejection, signature expiry, transaction replacement, and signing that outlives quote validity must fail safely and be represented in state and audit events.

If Phase 0 selects a managed or embedded wallet:

- Private keys must remain inside the wallet provider or managed signing boundary.
- Runtime and tool Lambdas must never retrieve raw private keys.
- Signing authority must be limited by chain, contracts, selectors, asset addresses, amounts, recipients, expiry, and session.
- User authorization must be revocable.
- The threat model must cover provider compromise, delegated-signing abuse, approval replay, malicious quotes, and confused-deputy attacks.

AgentCore Payments may be used only for payment transaction types explicitly supported by its current APIs. Do not route an arbitrary swap through it by assuming that “EVM-compatible wallet” means “arbitrary EVM signer.”

For every signing model, define sender and nonce ownership, gas payment, replay protection, permitted replacement behaviour, finality depth, and recovery from an ambiguous RPC response. A replacement that changes any approved payload field requires a new proposal and approval.

## 13. Memory and authoritative state

Use AgentCore Memory only for short-term conversation continuity in V1. Do not enable long-term memory unless a separate ADR establishes a concrete need and poisoning/privacy controls.

The following must live in deterministic stores, not agent memory:

- Wallet ownership and mappings.
- Asset registry.
- Balances and portfolio snapshots.
- Prices and quotes.
- Risk rules and policy versions.
- Proposals and payload hashes.
- Approvals and rejections.
- Nonces, idempotency records, and execution state.
- Transaction hashes and receipts.

Use actor and session isolation, encryption, retention limits, and input sanitization for any conversation events that are persisted. Do not include secrets or full signed transactions in memory.

## 14. Observability and audit

Generate a correlation ID at ingress and propagate it through Runtime, Gateway, tools, risk evaluation, approval, execution, and chain receipt processing.

Record structured events for:

- Authentication outcome and actor ID pseudonym.
- Runtime session, model ID, prompt/application version, and tool selection.
- Tool name, sanitized input hash, duration, and outcome.
- Gateway policy decision and matched policy version.
- Price, quote, portfolio, and registry versions used for risk evaluation.
- Every risk rule result and overall decision.
- Proposal ID, canonical payload hash, status transition, and expiry.
- Approval/rejection actor, method, timestamp, and bound hash.
- Execution claim, transaction hash, receipt, block, confirmations, and revert reason.
- Attempts to bypass Gateway, replay approvals, use stale quotes, exceed limits, change payloads, or execute twice.

Never log access tokens, secrets, private keys, raw signing material, session cookies, complete authorization headers, or unredacted sensitive prompts.

Create CloudWatch dashboards and alarms for:

- Policy denials and risk denials.
- Unauthorized calls and cross-user access attempts.
- Failed/reverted transactions.
- Duplicate execution attempts.
- Stale or unavailable price/quote data.
- RPC errors and chain-ID mismatches.
- Elevated latency/error rate for Gateway, Runtime, and tools.
- Unexpected cost or model-token usage.

For the prototype, DynamoDB is the operational system of record. Document that ordinary application logs are not an immutable regulatory ledger. Optionally export sanitized audit events to a versioned S3 bucket; do not imply regulatory compliance.

## 15. Infrastructure and repository layout

Use one repository with clear boundaries. The exact framework-generated files may differ, but preserve this structure:

```text
/
  README.md
  BUILD_SPEC.md
  Makefile or task runner
  .env.example
  docs/
    feasibility-report.md
    threat-model.md
    architecture.md
    demo-runbook.md
    adr/
  infra/
    bin/
    lib/
    test/
  agent/
    src/
    tests/
  services/
    asset_data/
    portfolio/
    risk/
    proposals/
    approvals/
    executor/
    shared/
  frontend/
    src/
    tests/
  contracts/             only if mock contracts are required
    src/
    script/
    test/
  spikes/
  scripts/
  tests/
    integration/
    e2e/
```

Infrastructure must include:

- Separate development/test configuration from any future production environment.
- Least-privilege IAM roles and resource policies.
- Encryption and explicit log retention.
- DynamoDB point-in-time recovery where appropriate.
- Secrets Manager references rather than secret values in templates or outputs.
- CloudWatch dashboards and alarms.
- CDK assertions and a security scanning step such as `cdk-nag`.
- Tagged resources and a documented cleanup command.
- No broad `*` permissions without a narrowly explained suppression.

Do not commit generated credentials, `.env`, CDK outputs containing secrets, wallet mnemonics, private keys, or funded test accounts.

## 16. Implementation phases

### Phase 0 — Validate

Produce the feasibility artefacts and connectivity probe. Select the execution mode and wallet model. No frontend polish.

### Phase 1 — Read-only vertical slice

- Deploy authentication, Gateway, Runtime, and read-only tools.
- Discover approved assets through the registry.
- Read portfolio, balance, price, multiplier, and trading status.
- Display data provenance and freshness.
- Add tracing and structured logs.

### Phase 2 — Governed proposal

- Implement quote adapter, transaction builder, risk service, and proposal store.
- Implement Cedar policies for the Gateway-expressible controls.
- Demonstrate allowed and denied proposals.
- Do not sign or broadcast transactions.

### Phase 3 — Human approval

- Build the minimal proposal-review UI.
- Show asset, side, amount, expected output, price, slippage, fees, chain, target, expiry, and policy results.
- Bind approval to the canonical payload hash and authenticated user.
- Demonstrate rejection, expiry, tampering detection, and replay prevention.

### Phase 4 — Testnet execution

- Add the isolated execution path selected in Phase 0.
- Re-evaluate risk immediately before execution.
- Broadcast once, wait for a receipt, and update the state machine.
- Display the explorer link and full audit timeline.

### Phase 5 — Hardening and handoff

- Complete negative tests and threat mitigations.
- Run dependency, secret, infrastructure, and static security scans.
- Verify a clean deployment and cleanup.
- Finish the architecture document, demo runbook, limitations, cost notes, and roadmap.

## 17. Testing requirements

### 17.1 Unit tests

Cover:

- Integer valuation and rounding.
- Corporate-action multiplier handling.
- Price and quote expiry.
- Every risk threshold boundary.
- Concentration calculation before and after a proposed transaction.
- Pending transactions counted toward exposure.
- Allowlist matching by address and chain, not ticker.
- Canonical payload hashing.
- State-transition validation.
- Idempotency and replay rejection.
- Log redaction.

### 17.2 Policy tests

Prove denial of:

- Unauthenticated callers.
- Wrong actor/tenant context.
- Unknown tools.
- Unsupported chain.
- Unapproved asset, token, venue, target, or selector.
- Transactions over USD 500.
- Execution without approval when required.
- Expired policy sessions where applicable.
- Attempts to reach Runtime or executor outside the governed route.

### 17.3 Integration tests

Use deterministic fixtures and mocked external failures. Cover:

- Stale/negative/zero price.
- Stale quote or changed quote payload.
- Sequencer or RPC unavailable.
- Chain-ID mismatch.
- Corporate-action multiplier update.
- Concurrent proposals that would jointly violate exposure.
- Approval by the wrong user.
- Modified calldata after approval.
- Duplicate execution calls.
- Transaction revert and ambiguous submission result.

### 17.4 End-to-end demonstrations

At minimum:

1. A USD 100 equivalent approved-asset proposal is approved automatically by application policy, but still requires explicit wallet authorization in user-signed mode, and then succeeds.
2. A USD 300 equivalent proposal pauses for approval and cannot execute beforehand.
3. A transaction over USD 500 is denied outside the model.
4. A proposal resulting in more than 20% single-asset exposure is denied outside the model.
5. An unapproved contract or asset is denied.
6. Tampering with an approved transaction invalidates approval.
7. Replaying an executed proposal does not create a second transaction.
8. The user can follow one correlation ID from request through confirmed receipt.

## 18. Definition of done

V1 is complete only when:

- Phase 0 evidence and ADRs are committed.
- A new developer can deploy the system using documented prerequisites and commands.
- The demonstration uses only valueless test assets/funds.
- The agent cannot access signing secrets or bypass the governed tool path.
- All state-changing actions use stored proposals and deterministic validation.
- When required, application approval is explicit, authenticated, payload-bound, expiring, and single-use; user-signed mode also requires distinct payload-bound wallet authorization for every transaction.
- Required policy, unit, integration, and end-to-end tests pass.
- CloudWatch shows the complete correlated audit trail with secrets redacted.
- The README accurately states what is real, mocked, unsupported, and unproven.
- The deployed resources can be removed using the documented cleanup process.
- No documentation implies endorsement, financial advice, production readiness, or ownership of underlying shares.

## 19. Codex working instructions

When implementing this specification:

1. Inspect the repository and current primary documentation first.
2. Complete Phase 0 before committing to a wallet, liquidity venue, transaction type, or test asset.
3. Prefer a thin, working vertical slice over broad scaffolding.
4. Keep blockchain, wallet, price, quote, and execution providers behind typed interfaces.
5. Keep model-facing tools narrower than internal service APIs.
6. Validate all external data at trust boundaries.
7. Add tests with each component; do not defer security tests until the end.
8. Never weaken a control merely to make the happy-path demo pass.
9. If blocked by service access, credentials, region availability, or unavailable testnet infrastructure, complete all safe local work and document the exact blocker and next action.
10. Keep `README.md`, ADRs, architecture diagrams, deployment instructions, and the demo runbook synchronized with the implementation.

At the end of each phase, report:

- What was implemented.
- Evidence that it works.
- Security controls added and tested.
- Assumptions validated or invalidated.
- Open risks and blockers.
- The exact next phase and its entry criteria.

## 20. Starting task for Codex

Begin with Phase 0 only.

Create the repository skeleton needed for the Phase 0 artefacts and connectivity probe. Inspect the latest official AWS AgentCore and Robinhood Chain documentation. Produce the four ADRs, feasibility report, and threat model described above. Implement and test the read-only probe without sending a blockchain transaction. Recommend one of the three execution modes and identify every credential or user decision required before Phase 1.

Do not deploy mainnet resources, send transactions, create funded wallets, or implement the complete application during Phase 0.

## 21. Primary references to verify during Phase 0

- AWS AgentCore overview: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html>
- AgentCore Runtime security: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-security-best-practices.html>
- AgentCore Policy concepts: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-core-concepts.html>
- AgentCore policy sessions: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-session-based-temporal.html>
- AgentCore observability: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-configure.html>
- AgentCore Memory security: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/best-practices.html>
- AgentCore Payments: <https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments.html>
- AWS agentic payments sample: <https://github.com/aws-samples/sample-agentic-serverless-payments>
- AWS crypto agent sample: <https://github.com/aws-samples/crypto-ai-agents-with-amazon-bedrock>
- Robinhood Chain connection details: <https://docs.robinhood.com/chain/connecting/>
- Robinhood Stock Tokens: <https://docs.robinhood.com/chain/stock-tokens/>
- Building with Stock Tokens: <https://docs.robinhood.com/chain/building-with-stock-tokens/>
- Robinhood token contracts: <https://docs.robinhood.com/chain/contracts/>
- Robinhood Chain terms: <https://docs.robinhood.com/chain/terms-of-service/>

These links are starting points, not frozen requirements. Record the documentation version or access date and adapt to current service behaviour.
