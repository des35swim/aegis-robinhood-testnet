# Threat model

Status: Phase 0 baseline  
Date: 2026-09-15  
Scope: valueless testnet/mock prototype only

## Security objectives

1. A model, prompt, webpage, tool result, or client cannot grant authority.
2. Only the authenticated actor's mapped wallet and proposals are visible or actionable.
3. Every executable transaction is registry-approved, deterministic, policy-compliant, payload-bound, unexpired, and claimed once.
4. Signing keys remain exclusively in the user's wallet.
5. Failure, ambiguity, stale state, or dependency disagreement denies or pauses execution.
6. One correlation ID reconstructs authentication, model/tool activity, policy, approval, wallet authorization, transaction, and receipt without exposing secrets.

## Assets

- Authenticated user and tenant identity.
- Wallet ownership mapping and ownership challenges.
- Versioned asset/venue/feed registry.
- Price, quote, portfolio, multiplier, and trading-status snapshots.
- Immutable proposal payload and hash.
- Application approval, execution authorization, nonce/exposure reservation, and lifecycle state.
- RPC/API credentials and AWS roles.
- Test wallet funds and signed transaction.
- Audit events and correlation identifiers.

Private keys are explicitly outside the application trust boundary.

## Trust boundaries

```text
Untrusted user/model/web content
          |
          v
Browser UI -- Cognito/OIDC --> Ingress Gateway --> Runtime (untrusted planner)
    |                                |                   |
    | human APIs                     | WAT               | governed tools only
    v                                v                   v
API Gateway/Lambda              Tool Gateway --> read/proposal/executor Lambdas
    |                                                   |
    +--------------------- DynamoDB/KMS ----------------+
                                |
Browser wallet -----------------+----> Robinhood Chain Testnet / RPC / APIs
```

The browser, model, remote metadata, external APIs, wallet extension, RPC provider, and chain pre-finality state are untrusted inputs. Gateway policy, deterministic services, DynamoDB conditional state, and wallet confirmation are independent controls rather than interchangeable sources of truth.

## Threats and controls

| Threat | Impact | Required controls | Verification |
|---|---|---|---|
| Prompt/tool injection requests an unauthorized trade | Unauthorized payload | Model has no signing/state credentials; narrow schemas; registry resolution server-side; default-deny Gateway policy; deterministic risk and executor revalidation | Adversarial tool-call tests and unapproved target/selector tests |
| Forged actor, tenant, wallet, or proposal ID | Cross-user access | Derive identity from verified JWT/WAT; server-side wallet mapping; ownership checks on every read/write; IDs are not authorization | Wrong-user integration tests and IAM tests |
| Runtime or client bypasses Gateway | Policy bypass | Runtime resource policy limited to Ingress Gateway role; tool Lambda resource/IAM permissions limited to Tool Gateway; Runtime has no DB/signing/RPC-write capability | Direct invocation denial tests |
| Reused or attacker-chosen policy session | Cross-session authorization | Application-generated random session IDs; authenticated Gateway principal binding; same-account/Region WAT; DynamoDB remains authoritative | Missing/malformed/cross-principal session tests |
| Conversation says “approve” | Unintended approval | Approval APIs absent from model tools; deliberate human UI; reauthentication; exact payload hash | Tool-manifest assertion and conversational injection E2E test |
| CSRF on approve/reject/execute preparation | Unauthorized state change | SameSite secure cookies or bearer-token API, anti-CSRF token where cookies are used, Origin/Referer enforcement, no GET mutations | Cross-origin negative tests |
| Clickjacking approval UI | Deceptive consent | CSP `frame-ancestors 'none'` and `X-Frame-Options: DENY`; trusted summary adjacent to confirmation | Response-header test |
| XSS tampers with wallet request | Altered payload/signature | Strict CSP, encoded rendering, dependency controls, server-issued canonical payload, wallet/account/chain checks, backend onchain verification | Frontend security tests and modified-calldata E2E test |
| Wallet account/network switches | Wrong sender/chain | Subscribe to provider changes; verify immediately before request and after hash return; proposal-bound sender/chain | Simulated switch tests |
| Wallet/provider compromised | Unauthorized signing | User confirmation, application approval, tight payload/expiry, backend transaction verification; clearly state wallet compromise cannot be fully mitigated | Threat drill and documentation |
| Approval or quote expires while wallet is open | Stale execution | Re-check immediately before preparation; short execution authorization; backend rejects late/reported transaction from completing governed state | Expiry race tests |
| Approval replay | Duplicate transaction | Single proposal/hash binding; conditional execution claim; nonce constraint; terminal states; identical-hash reconciliation only | Concurrent/replay tests |
| RPC timeout after broadcast | Accidental duplicate/replacement | `SUBMISSION_UNKNOWN`; reconcile by hash/sender/nonce; never construct a replacement under same proposal | Ambiguous-response integration test |
| Transaction replacement | Payload or fee change | Detect sender/nonce replacement; accept only exact canonical fields; invalidate otherwise; new proposal for material change | Replacement test |
| Chain reorganization | False finality | Distinguish soft/mined/L1-posted/final states; monitor canonical block/hash and L1 posting | Reorg fixture test |
| Malicious RPC lies about chain/state | Bad valuation/execution | Verify chain ID every session; compare critical reads through independent provider where practical; fail on disagreement; pin contracts | RPC disagreement tests |
| Sequencer outage/recovery | Stale price/order | Chainlink uptime feed plus grace period when available; RPC health; stale denial | Down/grace-period fixtures |
| Stale, zero, negative, or paused oracle | Incorrect notional | Read decimals/heartbeat dynamically; positive answer; updatedAt; `oraclePaused`; compatible multiplier snapshot | Boundary and stale-feed tests |
| Malicious or deceptive token metadata | Wrong asset shown | Registry is authoritative; metadata sanitized; symbol is display-only; address/chain shown; no remote metadata controls permissions | Confusable-symbol and HTML injection tests |
| Non-standard or fee-on-transfer token | Unexpected settlement | V1 mock contracts have reviewed fixed behavior; bytecode/address allowlist; verify balance deltas/receipt; deny unknown implementations | Contract behavior tests |
| Token callback/reentrancy | Multiple settlement/state corruption | Minimal exchange, checks-effects-interactions/reentrancy guard, exact allowlists, no arbitrary callbacks | Contract unit/fuzz tests before deployment |
| Unlimited or stale allowance | Excess spend authority | Exact/tightly bounded allowance, expiry/revocation, approved spender only; prefer single-call flow if feasible | Allowance boundary tests |
| Malicious RFQ/quote | Bad destination or replay | V1 uses mock exchange; future RFQ requires EIP-712 domain, approved signer, chain/venue/assets/amount/expiry binding, signature verification | Not applicable to chosen V1 route; required before RFQ ADR |
| MEV/front-running | Worse execution | Minimum output and short expiry; no public sensitive quote logging; acknowledge first-come sequencing does not remove all extraction/slippage risk | Slippage and expired-payload tests |
| Corporate-action race | Misvaluation | Bind multiplier/feed/registry versions; check pending/effective multiplier and oracle pause; invalidate rather than mutate | Effective-time concurrency tests |
| Concurrent proposals evade 20% limit | Excess concentration | Transactional pending-exposure reservation and fresh portfolio revalidation | Concurrent proposal integration test |
| Denial-of-service via proposal/tool/model use | Cost/unavailability | Authenticated quotas, per-actor rate limits outside temporal sessions, bounded payloads/timeouts, WAF/API quotas, model budget alarms | Load/limit tests and alarms |
| Log or trace leaks tokens/prompts/signatures | Credential/privacy loss | Structured allowlist logging, pseudonymous actor, hashes instead of raw sensitive data, redaction tests, retention/KMS | Automated redaction tests and sample-log review |
| Dependency/supply-chain compromise | Code execution | Exact locks, provenance/SBOM, Dependabot/scanning, minimal dependencies, signed CI releases | CI security scans |
| Deployment role compromise | Control-plane takeover | Separate deployment/runtime roles, MFA/short-lived credentials, no wildcard permissions, CloudTrail and Access Analyzer | CDK assertions and IAM review |

## Abuse cases that must fail closed

- User asks the agent to ignore policy or use a contract supplied in chat.
- Model invents a price, quote, approval, user ID, or wallet.
- Client changes `proposalId`, payload hash, calldata, recipient, chain, or amount.
- Attacker obtains another user's proposal ID.
- Quote expires between approval and signing.
- Policy engine, price source, RPC, sequencer check, or registry is unavailable.
- RPC providers disagree on chain ID, bytecode, nonce, or receipt.
- The same proposal is prepared or reported concurrently.
- A transaction hash exists but its decoded payload differs.
- A receipt disappears or moves after a reorganization.

## Residual risks and prototype limitations

- A compromised user wallet can authorize transactions; the backend can detect mismatch but cannot repair the wallet.
- Testnet and mock behavior do not establish production liquidity, regulatory suitability, canonical Stock Token compatibility, or economic safety.
- CloudWatch and DynamoDB provide operational auditability, not an immutable regulatory ledger.
- Public/provider RPC availability and correctness remain external dependencies.
- Browser signing can be abandoned or independently retried by the user; the application guarantees a single governed claim, not global exactly-once blockchain submission.
- Eligibility/legal analysis is outside this technical prototype and remains unresolved.

## Review gates

Revisit this model before adding a managed signer, canonical assets, RFQ, long-term memory, mainnet, real value, new wallet provider, arbitrary token contracts, or cross-chain behavior. Each requires a new or superseding ADR and dedicated negative tests.
