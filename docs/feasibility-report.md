# Phase 0 feasibility report

Status: **Phase 0 complete; approved for Phase 1 preparation**
Checked: **2026-09-20 (Australia/Melbourne)**  
Recommended execution mode: **Mock testnet mode**

## Executive decision

The AWS control-plane design is feasible in `ap-southeast-2` (Sydney). Current AWS documentation lists Runtime microVMs, Memory, Gateway, Identity, Observability, and Policy in AgentCore in Sydney, and separately lists temporal policy support there ([AWS supported Regions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-regions.html), [temporal-policy Regions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-temporal.html)).

Robinhood Chain Testnet exists and a credentialed Alchemy RPC successfully returned chain ID `46630`, block `120271460`, and a balance read on 2026-09-16. The documented public testnet RPC was not usable during the earlier check. The public Robinhood Stock Token API returned 194 assets, including AMZN, but every deployment in that response used mainnet chain ID `4663`; it returned no deployment for testnet chain ID `46630`. Current official documentation names RFQ and AMM approaches but does not publish a canonical, authenticated testnet quote endpoint or a testnet Stock Token/feed registry ([connecting](https://docs.robinhood.com/chain/connecting/), [Stock Token APIs](https://docs.robinhood.com/chain/stock-token-apis/), [building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens/), [sanitized probe evidence](evidence/2026-09-16-connectivity-probe.json)).

Therefore, canonical testnet mode is not evidenced. Mock testnet mode best preserves the intended Robinhood Chain integration while making all test assets visibly synthetic. RPC connectivity and a balance read for a user-controlled public test wallet are verified. Alchemy now documents a Robinhood Testnet faucet, satisfying the documentary gas-availability criterion, although the current wallet remains unfunded and faucet eligibility is not guaranteed. The project owner accepted the Phase 0 design defaults on 2026-09-20. Local simulation remains the fallback if valueless gas cannot be obtained before deployment.

## Evidence matrix

Status meanings: **pass** means primary documentation or direct evidence is sufficient for the Phase 0 decision; **fail** means evidence contradicts the desired capability; **not available** means it could not be verified and must fail closed.

### AWS capabilities

| Requirement | Status | Evidence and consequence |
|---|---:|---|
| Required services and SDK versions | pass | Use Python 3.12; `bedrock-agentcore` latest observed stable release was `1.22.0`; the legacy Python starter toolkit directs new projects to `@aws/agentcore`, whose observed release was `0.29.0`; `aws-cdk-lib` observed release was `2.269.0` ([AgentCore SDK on PyPI](https://pypi.org/project/bedrock-agentcore/), [AWS CLI repository](https://github.com/aws/agentcore-cli), [AgentCore CLI on npm](https://www.npmjs.com/package/@aws/agentcore), [AWS CDK library](https://www.npmjs.com/package/aws-cdk-lib)). Pin exact versions and lockfiles when Phase 1 scaffolding is created; re-check before installation. |
| Region availability | pass | Sydney supports the required AgentCore services and temporal policies ([AWS supported Regions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-regions.html), [temporal policies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-temporal.html)). Use one account and `ap-southeast-2`; temporal propagation does not span AgentCore accounts or Regions. |
| Gateway inbound authentication | pass | Gateway supports JWT, IAM, and offloaded modes. For the browser use Cognito/OIDC JWT with explicit issuer, audience/client, and scopes; do not use `NONE` ([Gateway inbound authorization](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-inbound-auth.html)). |
| Workload identity propagation | pass | In a Gateway → Runtime → Gateway route, AgentCore propagates caller principal and policy session in a service-managed Workload Access Token. The application supplies the policy-session ID; it must not construct the WAT ([policy sessions and identity propagation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-session-based-temporal.html)). |
| Prevent direct Runtime bypass | pass | For IAM Runtime auth, restrict the Runtime resource policy to the Gateway execution role. For JWT Runtime auth, use `allowedWorkloadConfiguration`. The selected design uses Gateway-to-Runtime IAM and denies other invokers ([Runtime security](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-security-best-practices.html)). |
| Cedar/Dogwood schema and numeric precision | pass | Gateway generates the Cedar schema from tool definitions. Cedar has no float; Decimal is limited to four decimal places. Arrays become unordered sets, schema is under 400 KB, individual policies are limited to 10 KB, and input/output context cannot be mixed in one invocation ([schema constraints](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-schema-constraints.html), [policy limitations](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-limitations-section.html)). Money and token arithmetic stays in the deterministic risk service using integers. |
| Temporal behavior, quotas, and logging | pass | Dogwood provides session-scoped history with default-deny semantics. Documented limits are 25 temporal policies per engine, three temporal operators per policy, and a 24-hour maximum window. Policy changes invalidate active temporal sessions. Metrics use `AWS/Bedrock-AgentCore`; spans appear in `aws/spans` when tracing is enabled ([temporal policies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-temporal.html)). Use temporal policy only as a defense-in-depth sequence check; DynamoDB remains authoritative. |
| Gateway outbound authentication | pass | Lambda targets support Gateway IAM roles; HTTP/MCP/OpenAPI targets also support applicable OAuth/API-key modes. Use IAM for owned Lambda targets and AgentCore Identity/Secrets Manager only for approved external APIs ([Gateway outbound authorization](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-outbound-auth.html)). |
| Runtime networking and egress | pass | Runtime supports VPC mode. It has no internet access by default in VPC mode; internet egress requires private subnets plus NAT, while AWS services can use VPC endpoints. Security groups control ENI traffic ([Runtime VPC connectivity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html)). Phase 1 should route tool access through Gateway/Lambda and give Runtime no direct blockchain egress. |
| Observability | pass | Built-in metrics cover Runtime, Memory, Gateway, tools, and Identity. Full custom telemetry requires ADOT; the current documentation requires `aws-opentelemetry-distro` 0.18.0 or later and CloudWatch Transaction Search setup ([AgentCore observability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-configure.html)). |
| Memory security | pass | Memory supports actor/session organization, KMS encryption, and configurable raw-event expiry up to 365 days. AWS warns about prompt injection and poisoning ([Memory organization](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-organization.html), [Memory best practices](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/best-practices.html), [create Memory](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-create-a-memory-store.html)). V1 will use short-term events only, with server-derived actor/session identifiers and short retention. |
| AgentCore Payments as swap signer | fail | Payments is documented for paid APIs/content using x402 v1/v2 or MPP, stablecoin payment instruments, and CoinbaseCDP or Stripe/Privy connectors. Its documented flow constructs a protocol payment proof; it does not expose a general arbitrary-calldata Robinhood Chain swap signer ([Payments overview](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments.html), [Payments operation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments-how-it-works.html)). Exclude it from the transaction path. |

### Robinhood Chain capabilities

| Requirement | Status | Evidence and consequence |
|---|---:|---|
| Chain IDs and endpoints | pass | Official values are mainnet `4663`, testnet `46630`, ETH gas, and the documented public/provider URLs ([connecting](https://docs.robinhood.com/chain/connecting/)). A credentialed Alchemy RPC returned chain ID `46630` and block `120271460` on 2026-09-16 ([sanitized evidence](evidence/2026-09-16-connectivity-probe.json)). The documented public endpoint remained unsuitable, so deployed use requires a protected provider credential. |
| Canonical AMZN and another testnet Stock Token | not available | Direct `GET https://api.robinhood.com/rhj/assets` returned 194 assets on 2026-09-15 and all deployments had chain ID `4663`; AMZN was `0x12f190a9F9d7D37a250758b26824B97CE941bF54` on mainnet. No chain `46630` deployment was returned. Never reuse that mainnet address in testnet configuration ([Stock Token API](https://docs.robinhood.com/chain/stock-token-apis/)). |
| Canonical registry and verification | not available for testnet | The public API exposes immutable asset IDs, checksummed deployment addresses, status, multiplier, decimals, and trading capabilities; the contracts page states addresses must identify canonical tokens. Both currently expose mainnet asset deployments only ([Stock Token API](https://docs.robinhood.com/chain/stock-token-apis/), [token contracts](https://docs.robinhood.com/chain/contracts/)). Mock deployments must use a repository-owned versioned registry and verified explorer source. |
| ERC-20 and ERC-8056 behavior | pass for documented interface; not available on testnet asset | Stock Tokens are ERC-20 with 18 decimals and implement ERC-8056 `uiMultiplier()`; raw balances do not rebase. Pending multiplier and effective time are separately readable ([building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens/)). Mock contracts must reproduce only the interface behavior needed for tests and be labelled mock. |
| Price feeds and safety checks | not available for testnet | Official docs describe per-token Chainlink AggregatorV3 feeds, multiplier-adjusted token prices, staleness checks, sequencer uptime/grace-period checks, and `oraclePaused()` checks. Chainlink's listed Robinhood feed network is mainnet; no testnet feed/address list was found ([Robinhood oracle guidance](https://docs.robinhood.com/chain/oracles-and-price-feeds/), [Chainlink Robinhood feeds](https://docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood)). Mock testnet mode needs a labelled mock feed plus deterministic staleness/pause controls. |
| Liquidity and execution route | not available for testnet | Robinhood documents RFQ aggregators, standard AMMs, proprietary AMMs, and orderbooks as patterns, but does not publish an approved testnet pool or RFQ endpoint in the cited guide ([building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens/)). Use a minimal mock exchange only after its contracts and selectors are fixed in ADR 0003. |
| Quote authentication/replay/expiry | not available | RFQ quotes are described as market-maker signed, but no testnet API, signing domain, signer registry, or expiry schema is published in the reviewed primary docs ([building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens/)). The mock quote service must sign a domain-separated typed payload, expire it, and bind chain/venue/assets/amounts. |
| Wallet compatibility | pass for address read | Robinhood Chain is EVM-compatible and the official wallet page describes Robinhood Wallet and browser wallets such as MetaMask ([add network to wallet](https://docs.robinhood.com/chain/add-network-to-wallet/)). On 2026-09-20, the probe validated and read the zero balance of a user-controlled public EVM address on chain `46630` ([sanitized evidence](evidence/2026-09-20-wallet-probe.json)). Wallet connection and signing remain later-phase tests. |
| Gas token and faucet | pass with deployment qualification | ETH is the documented gas token. Alchemy, Robinhood's recommended RPC provider, documents a Robinhood Testnet faucet dispensing `0.1` testnet ETH per eligible wallet per 24 hours ([connecting](https://docs.robinhood.com/chain/connecting/), [Alchemy faucet](https://www.alchemy.com/faucets/robinhood-testnet)). Alchemy applies wallet-eligibility rules, so receipt of valueless gas must be verified before mock-contract deployment; real ETH must not be acquired merely to qualify. |
| Trading status and corporate actions | pass for API semantics; not available for testnet | `/assets` exposes asset status, trading capabilities, current/pending multiplier, and effective time; `/prices` exposes halt and generation time. Onchain oracle pause and multiplier consistency are also required ([Stock Token API](https://docs.robinhood.com/chain/stock-token-apis/), [oracle guidance](https://docs.robinhood.com/chain/oracles-and-price-feeds/)). Mock controls must exercise all fail-closed states. |
| Finality | pass | Robinhood documents soft confirmation, posting to Ethereum, and Ethereum finality (typically about 13 minutes after posting), with reorganization risk before L1 posting ([transaction finality](https://docs.robinhood.com/chain/transaction-finality/)). The prototype may display soft confirmation but records `CONFIRMED` only at the confirmation level selected in ADR 0001. |
| Jurisdiction and eligibility | not available / user decision | The technical docs say availability can depend on eligible regions, while the Terms allocate wallet and service-use responsibilities to the user ([building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens/), [Terms](https://docs.robinhood.com/chain/terms-of-service/)). This prototype must remain valueless and is not evidence of legal eligibility or production compliance. |

## Direct observations

These observations were made on 2026-09-15 and are intentionally separated from documentation claims:

- [`https://rpc.testnet.chain.robinhood.com`](https://rpc.testnet.chain.robinhood.com): DNS resolution failed on two read-only `eth_chainId` attempts.
- [`https://rpc.mainnet.chain.robinhood.com`](https://rpc.mainnet.chain.robinhood.com): hostname resolved and returned HTTP 400 to an empty GET, consistent with a JSON-RPC endpoint. No transaction was sent.
- [Official testnet Blockscout stats API](https://explorer.testnet.chain.robinhood.com/api/v2/stats): HTTP 200; response reported block and transaction statistics.
- [Robinhood asset API](https://api.robinhood.com/rhj/assets): HTTP 200; 194 assets; deployment chain IDs observed: `[4663]`; AMZN mainnet metadata was present.
- [Robinhood AMZN price API](https://api.robinhood.com/rhj/prices/AMZN): HTTP 200; returned a mainnet AMZN price record. It is not a transaction quote and was not treated as testnet evidence.

Additional observation on 2026-09-16:

- A credentialed Alchemy testnet endpoint returned expected chain ID `46630`, latest block `120271460`, and a successful balance read. The configured address was the zero address, so this proves read connectivity only, not wallet ownership or spendable gas ([sanitized probe output](evidence/2026-09-16-connectivity-probe.json)).

Additional observation on 2026-09-20:

- The same read-only probe returned expected chain ID `46630`, latest block `122018751`, and a valid zero-balance read for a user-controlled public EVM address. The repository evidence redacts the address for privacy ([sanitized probe output](evidence/2026-09-20-wallet-probe.json)).

## Selected mode and entry criteria

ADR 0003 selects **mock testnet mode**. Its Phase 0 entry criteria are resolved as follows:

1. ~~A credentialed Robinhood Chain Testnet HTTPS RPC responds with chain ID `46630` and latest block.~~ Verified 2026-09-16.
2. ~~A user-controlled public test wallet address can be read.~~ Verified 2026-09-20. Later deployment still requires separately approved valueless test ETH.
3. ~~A faucet or other permitted test-gas source is documented.~~ Alchemy's Robinhood Testnet faucet verified 2026-09-20; actual receipt remains a deployment prerequisite.
4. ~~The read-only probe passes chain, block, and balance checks for the user-controlled public test address.~~ Verified 2026-09-20; balance is zero.
5. ~~The mock token, settlement token, feed, and exchange interfaces are reviewed and their future deployment/verification procedure is accepted.~~ Accepted by the project owner 2026-09-20.
6. ~~Cognito and the single-account Sydney architecture are accepted as the deployment defaults.~~ Accepted by the project owner 2026-09-20. Possession of an AWS account is a Phase 1 deployment prerequisite, not a Phase 0 completion requirement.

If valueless testnet gas cannot actually be obtained before mock deployment, supersede ADR 0003 with local simulation mode and run the same probe against a real local EVM node.

## Required credentials before Phase 1 deployment

Credentials must never be committed or placed in prompts/logs.

- AWS account and deployment role/profile authorized for a development environment in `ap-southeast-2`.
- Bedrock model-access confirmation for the chosen model in that Region.
- A dedicated Robinhood Chain Testnet RPC URL from Alchemy or another documented provider; store any provider token in Secrets Manager for deployed environments.
- A public test wallet address. Verified for read access on 2026-09-20; no private key or mnemonic is requested.
- Valueless testnet ETH from the documented faucet or another permitted source, required before mock-contract deployment.

Accepted design decisions (2026-09-20): `ap-southeast-2`; one AWS account for AgentCore temporal-policy hops; Cognito authentication; browser-wallet signs-and-broadcasts; visibly labelled mock testnet assets; fixed-function mock exchange; and `posted to L1` as the audit-demo `CONFIRMED` threshold, with earlier status displayed as provisional.

## Phase 0 outcome

Implemented: evidence review, four ADRs, threat model, architecture note, and a read-only probe with offline tests.  
Evidence: direct endpoint observations above and linked primary documentation.  
Security controls: RPC method allowlist, credential-safe URL reporting, server-configured chain ID, explicit unavailable states, and no signing/broadcast code.  
Validated: AWS architecture and Sydney availability.  
Invalidated: assumption that canonical Stock Token metadata, feeds, or liquidity are currently published for testnet; assumption that the documented public testnet RPC is presently usable from this environment.  
Phase 0 decision: **complete**; mock testnet mode and all architectural defaults were accepted by the project owner on 2026-09-20.
Phase 1 prerequisites: obtain AWS development access and Bedrock model access before cloud deployment, and verify receipt of valueless testnet ETH before mock-contract deployment. Local scaffolding and tests may begin without those credentials.
