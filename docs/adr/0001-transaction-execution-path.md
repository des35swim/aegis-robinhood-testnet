# ADR 0001: Transaction execution path

- Status: Accepted for prototype; live validation deferred to later phases
- Date: 2026-09-15
- Accepted by project owner: 2026-09-20

## Context

The agent must never possess signing authority or submit arbitrary calldata. Application approval, wallet authorization, transaction submission, and receipt tracking must remain distinct. AgentCore Payments is designed for x402/MPP merchant payments rather than general swap calldata ([AWS Payments](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments.html)). Robinhood Chain supports standard EVM wallets and reaches finality in stages ([wallet setup](https://docs.robinhood.com/chain/add-network-to-wallet/), [transaction finality](https://docs.robinhood.com/chain/transaction-finality/)).

## Decision

Use **browser wallet signs and broadcasts**, with a governed backend preparation/claim step and an independent backend receipt verifier.

1. The proposal service constructs and persists a canonical unsigned EIP-1559 transaction payload from the versioned registry and quote.
2. Policy and deterministic risk checks determine application approval. Approval, when required, binds the canonical payload hash.
3. A human-only UI calls the execution-preparation endpoint with only the proposal ID and expected payload hash.
4. The executor reloads the proposal, re-evaluates all invariants, reserves nonce/exposure as applicable, conditionally moves it to `AWAITING_SIGNATURE`, and returns the canonical payload plus a short-lived execution authorization.
5. The browser verifies connected chain and account, asks the wallet to display/sign/send that exact transaction, then reports the transaction hash.
6. The receipt verifier independently loads the onchain transaction by hash and accepts it only if sender, chain, nonce, target, value, and calldata match the stored canonical payload.
7. The verifier records `SUBMITTED`, `MINED`, and finally `CONFIRMED`. For the audit demo, `CONFIRMED` means the batch is posted to Ethereum; soft confirmation is displayed only as provisional. Full Ethereum finality can be reported separately.

The agent-facing execution tool may request preparation for an already approved stored proposal, but it cannot supply transaction fields. The human UI remains the only component allowed to trigger wallet authorization.

## Exactly-once interpretation

The backend permits one successful execution claim per proposal. Wallet or RPC behavior cannot guarantee exactly-once submission. Re-observing or rebroadcasting identical signed bytes is idempotent by transaction hash. A replacement transaction or any payload difference invalidates the proposal and requires a new proposal/approval. Ambiguous results enter reconciliation; they are never treated as permission to construct a new transaction.

## Rejected alternatives

- **Backend receives raw signed bytes and broadcasts:** many injected wallets do not expose a safe, portable sign-without-send flow; it also expands backend handling of signed material.
- **Managed backend signer:** simplifies submission control but introduces delegated signing risk and provider-specific wallet policy. Reconsider only through a new ADR.
- **AgentCore Payments:** its documented scope is x402/MPP stablecoin payment proof processing, not arbitrary Robinhood Chain swap execution.

## Consequences

- The backend must reconcile wallet-submitted hashes and handle rejection, timeout, replacement, drop, and reorganization.
- A malicious browser cannot alter the stored proposal, but it can refuse to sign or report a false hash; onchain verification catches the latter.
- The selected wallet must be tested on chain ID `46630` before Phase 1 exits.
- The finality detector needs an Arbitrum/Robinhood mechanism for determining L1 posting; block-count heuristics alone are insufficient.
