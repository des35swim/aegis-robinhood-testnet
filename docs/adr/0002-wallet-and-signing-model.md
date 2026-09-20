# ADR 0002: Wallet and signing model

- Status: Accepted for prototype; live wallet validation deferred to later phases
- Date: 2026-09-15
- Accepted by project owner: 2026-09-20

## Context

The prototype must demonstrate explicit user control without placing private keys in prompts, Runtime, application storage, browser storage, Lambda, logs, or source control. Robinhood Chain documents compatibility with EVM browser wallets ([wallet setup](https://docs.robinhood.com/chain/add-network-to-wallet/)).

## Decision

Use a **user-controlled injected EIP-1193 browser wallet** on Robinhood Chain Testnet.

- The authenticated application account is mapped server-side to an allowlisted wallet address after a deliberate ownership-verification challenge.
- The backend derives actor, tenant, and expected wallet from verified identity and storage, never from model arguments.
- The UI accepts only the connected account and chain that match the stored proposal.
- The wallet signs and sends the exact canonical payload prepared under ADR 0001.
- The application stores addresses, challenges, signatures used to prove ownership, proposal hashes, and transaction hashes; it never requests or stores keys or mnemonics.
- Wallet authorization is required for every transaction. Application approval above the policy threshold remains a separate event.
- Wallet ownership challenges must be domain-separated, single-use, expiring, bound to origin, chain, authenticated actor, and a server nonce. A later implementation may use SIWE if its exact message/profile is documented and tested.

## Required client controls

- Refuse signing when `eth_chainId` is not `46630`.
- Refuse signing when the selected account differs from the stored proposal wallet.
- Re-render the trusted server summary immediately before wallet invocation.
- Use CSP, frame-ancestors denial, CSRF protections, secure cookies, and origin validation on human-control-plane endpoints.
- Treat account/network changes, rejection, timeout, or quote expiry as safe cancellation/expiry.
- Never accept an arbitrary destination, calldata, amount, gas override, or spender from URL state or agent output.

## Rejected alternatives

- **Application-managed private key:** violates wallet isolation and makes the prototype custodial.
- **Local key in browser storage:** exposes signing material to XSS, extensions, backups, and logging.
- **AgentCore Payments wallet:** its documented payment protocols do not establish general swap-signing capability.
- **Embedded/managed wallet:** possible later, but requires provider-specific delegated-authority and revocation validation.

## Consequences

- The user must install a compatible wallet and explicitly authorize the testnet transaction.
- Phase 0 needs only a public address. Testnet ETH is required later for deployment/execution, never for this read-only probe.
- Account ownership and application authentication are separate; both are required before a proposal becomes executable.
