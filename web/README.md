# Aegis web experience

The frontend presents Aegis as the governance layer between a financial AI agent and execution. It contains two connected surfaces:

- a narrative overview explaining deterministic policy, human approval, constrained execution and governance evidence; and
- a Robinhood Chain Testnet portfolio use case demonstrating allowed and denied proposals.

The portfolio, agent reasoning, policy decisions, wallet state, approvals and transaction flow are deterministic simulations. Anonymous feedback can be sent to the deployed AWS feedback API when `NEXT_PUBLIC_FEEDBACK_API_URL` is configured.

## Local development

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:5173`.

## Validation

```bash
npm run lint
npm run build
```

The static production export is written to `dist/client` for deployment by the CDK application in `../infra`.

## Configuration

Copy `.env.example` only when local overrides are needed:

- `NEXT_PUBLIC_FEEDBACK_API_URL` — optional deployed `POST /feedback` endpoint.
- `NEXT_PUBLIC_PROJECT_README_URL` — optional override for the “How it works” link.

Do not put wallet keys, recovery phrases or credentialed RPC URLs in frontend environment variables.
