# ADR 0003: Test assets and liquidity

- Status: Accepted provisionally; RPC and wallet read verified, Phase 1 blocked on test gas
- Date: 2026-09-15

## Context

Robinhood's public asset API currently returns canonical mainnet Stock Token deployments only. On 2026-09-15 the response contained 194 assets and only chain ID `4663`; AMZN had no testnet deployment. Current Chainlink documentation lists the Robinhood feed network as mainnet, and Robinhood's integration guide describes RFQ/AMM patterns without publishing an authenticated testnet quote route ([Stock Token APIs](https://docs.robinhood.com/chain/stock-token-apis/), [Chainlink feeds](https://docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood), [liquidity patterns](https://docs.robinhood.com/chain/building-with-stock-tokens/)).

The official testnet explorer is live. The documented public testnet RPC was unusable from the development environment, but a credentialed Alchemy endpoint returned chain ID `46630` and current block data on 2026-09-16. A protected provider RPC is therefore required for later deployment.

## Decision

Select **mock testnet mode**.

After Phase 0 blockers are cleared, deploy visibly labelled, valueless contracts to Robinhood Chain Testnet:

- `MockAmazonExposureToken` and at least one second mock ERC-20/8056-style asset;
- a mock USD settlement token;
- a mock price feed implementing only the AggregatorV3 read interface needed by the application, with controllable freshness/pause cases;
- a minimal fixed-function mock exchange supporting only exact-input swaps between registry-approved pairs.

The contract names, symbols, UI, registry, README, and explorer links must all include **Mock** or **Test**. They must not use Robinhood artwork or claim to be Robinhood Stock Tokens. AMZN remains a display preference, not an authoritative identifier.

The mock exchange is preferred over an RFQ service for V1 because it permits deterministic expiry/slippage/revert tests without pretending an undocumented market-maker quote is authentic. Its target, selectors, recipients, asset addresses, and maximum amounts will be fixed in a versioned registry.

## Registry evidence rules

- Mainnet addresses can be read for research but never copied into the testnet allowlist.
- Every mock address must be tied to chain ID `46630`, source commit, deployment transaction, verified bytecode/source, and registry version.
- Token symbol/name are display-only. Internal immutable IDs and addresses are authoritative.
- Price data from `/rhj/prices` is not an executable quote and cannot authorize a transaction.

## Fallback

If a credentialed testnet RPC, public test address, and documented test-gas source cannot be supplied, supersede this ADR with **local simulation mode**. Provider interfaces and chain checks must remain identical, and the UI must state that Robinhood Chain integration is unproven.

## Consequences

- Testnet chain/read connectivity passed on 2026-09-16, and a user-controlled public address read passed on 2026-09-20. Phase 1 remains no-go until a permitted test-gas source is verified and the remaining entry criteria are resolved.
- Contract implementation/deployment begins only in the phase authorized by the build spec, not Phase 0.
- The demo proves governance controls, not real liquidity, price discovery, or canonical Stock Token compatibility.
