# Aegis Guard Dog Test (`GDOGT`)

`GDOGT` is a fixed-supply, valueless ERC-20 prepared solely for a Robinhood Chain Testnet software demonstration.

It is **not deployed**, offered for sale, backed by an asset, associated with Robinhood, or intended to have a market price. Do not send real funds to obtain it.

## Deliberate constraints

- Name: `Aegis Guard Dog Test`
- Symbol: `GDOGT`
- Network: Robinhood Chain Testnet (`46630`) only
- Supply: `1,000,000,000` tokens, minted once to the deployment recipient
- Decimals: `18`
- No later minting
- No owner or administrator
- No tax, fee, blacklist, pause, upgrade, or trading restriction
- No liquidity pool or sale

The implementation uses OpenZeppelin's ERC-20 base contract and follows its fixed-supply pattern.

## Local verification

```bash
npm install
npm test
```

The generated artifact under `build/` is intentionally ignored. A deployment record must not be created until a browser-wallet deployment is explicitly authorized, valueless testnet ETH is available, and the resulting address and explorer transaction are independently verified.

Never place a private key, mnemonic, recovery phrase, or credentialed RPC URL in this directory.
