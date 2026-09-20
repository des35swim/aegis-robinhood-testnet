# Governed RWA Agent on AWS

An open-source, valueless prototype for demonstrating an AWS-native governance boundary around an AI-proposed transaction involving a clearly labelled test substitute for a Stock Token.

This repository has completed **Phase 0: feasibility validation**. It does not contain a production trading system, does not use real funds, and is not affiliated with or endorsed by AWS, Amazon, Robinhood, NVIDIA, Chainlink, or any wallet/liquidity provider. Stock Tokens provide economic exposure through tokenised debt securities; they are not ownership of underlying shares.

## Current outcome

- Recommended mode: mock assets on Robinhood Chain Testnet.
- Phase 0 status: complete; the project owner accepted the documented defaults on 2026-09-20.
- Phase 1 deployment prerequisites: an AWS development account/role, Bedrock model access, and valueless testnet ETH before mock-contract deployment.
- No contracts were deployed, wallets created, funds moved, transactions signed, or transactions broadcast during Phase 0.

Read [the feasibility report](docs/feasibility-report.md), [the threat model](docs/threat-model.md), and [the ADRs](docs/adr/).

## Commands

```bash
make test
make probe
```

`make probe` uses the intentionally incomplete checked-in example configuration. It is expected to fail or report unavailable components until local testnet inputs are supplied. See [the probe guide](spikes/connectivity_probe/README.md).
