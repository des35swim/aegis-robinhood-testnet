# Governed RWA Agent on AWS

An open-source, valueless prototype for demonstrating an AWS-native governance boundary around an AI-proposed transaction involving a clearly labelled test substitute for a Stock Token.

This repository is in **Phase 0: feasibility validation**. It does not contain a production trading system, does not use real funds, and is not affiliated with or endorsed by AWS, Amazon, Robinhood, NVIDIA, Chainlink, or any wallet/liquidity provider. Stock Tokens provide economic exposure through tokenised debt securities; they are not ownership of underlying shares.

## Current outcome

- Recommended mode: mock assets on Robinhood Chain Testnet.
- Phase 1 status: testnet RPC connectivity and a user-controlled wallet balance read passed; blocked pending a documented test-gas source and the remaining Phase 0 entry decisions.
- No contracts were deployed, wallets created, funds moved, transactions signed, or transactions broadcast during Phase 0.

Read [the feasibility report](docs/feasibility-report.md), [the threat model](docs/threat-model.md), and [the ADRs](docs/adr/).

## Commands

```bash
make test
make probe
```

`make probe` uses the intentionally incomplete checked-in example configuration. It is expected to fail or report unavailable components until the Phase 0 testnet inputs are supplied. See [the probe guide](spikes/connectivity_probe/README.md).
