# ADR 0006: Valueless testnet demo meme token

- Status: Accepted for local preparation; deployment pending
- Date: 2026-09-26
- Accepted by project owner: 2026-09-26

## Context

The POC benefits from a tangible onchain artifact, but it must not become a real-money token launch or imply affiliation with Robinhood. The project owner authorized a meme-style token strictly as a testnet demonstration.

## Decision

Prepare `Aegis Guard Dog Test` (`GDOGT`) as a fixed-supply ERC-20 for Robinhood Chain Testnet (`46630`) only.

- Mint `1,000,000,000` tokens once to the deployment recipient.
- Provide no owner, administrator, post-deployment minting, pause, blacklist, fee, tax, upgrade, sale, or liquidity mechanism.
- Display `Test`, `Demo`, `Valueless`, and `No real funds` disclosures wherever the token appears.
- Do not copy Robinhood branding or represent the token as a Robinhood Stock Token.
- Do not deploy until the user explicitly authorizes the browser-wallet transaction and has valueless testnet ETH.
- Never request or handle a private key or recovery phrase.

## Consequences

The token may be described as a **testnet demo meme token**. It must not be described as a launched mainnet meme coin, investment, financial product, official Robinhood asset, or token with expected value. Any sale, real liquidity, mainnet deployment, or value-oriented marketing is outside this ADR and requires separate security and specialist legal review.
