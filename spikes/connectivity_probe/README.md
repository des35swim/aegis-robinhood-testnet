# Read-only connectivity probe

This spike verifies chain identity, latest block, native balance, approved asset metadata, optional token bytecode and ERC-20 metadata, REST price freshness, optional Chainlink feed state, and quote availability. It never signs or sends a transaction.

The JSON-RPC client has a code-level allowlist containing only `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_getCode`, and `eth_call`. Output and errors report only an endpoint's scheme and hostname; URL paths and query strings are always removed because providers commonly place credentials there. URLs containing credentials in user-info are rejected.

## Run

Copy `config.example.json` to the ignored `config.local.json` when credentials or provider-specific URLs are needed, then supply a public wallet address. Do not paste a credentialed RPC URL into chat, logs, or a committed file. The zero address is safe for connectivity checks but is not evidence of a test wallet controlled by the user.

```bash
python3 spikes/connectivity_probe/probe.py \
  --config spikes/connectivity_probe/config.local.json
```

The checked-in configuration intentionally has no unverified asset contract, price-feed address, or quote endpoint. Those checks report `unavailable` until Phase 0 evidence establishes appropriate testnet values.

## Test

```bash
python3 -m unittest discover -s spikes/connectivity_probe/tests -v
```

Tests use an in-memory transport and do not access a network.
