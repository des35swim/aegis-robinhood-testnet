import json
import unittest
from datetime import datetime, timezone

from spikes.connectivity_probe.probe import (
    ADDRESS_ZERO,
    ProbeError,
    RpcClient,
    decode_abi_string,
    encode_balance_of,
    run_probe,
    safe_url,
)


def abi_string(value: str) -> str:
    encoded = value.encode()
    padding = b"\x00" * ((32 - len(encoded) % 32) % 32)
    return "0x" + (32).to_bytes(32, "big").hex() + len(encoded).to_bytes(32, "big").hex() + (encoded + padding).hex()


class FakeTransport:
    def __init__(self) -> None:
        self.rpc_methods = []

    def get_json(self, url):
        if url.endswith("/assets"):
            return {
                "assets": [
                    {
                        "id": "asset-amzn",
                        "tokenSymbol": "AMZN",
                        "tokenName": "Mock AMZN test asset",
                        "deployments": [{"chainId": 31337, "contractAddress": "0x" + "11" * 20}],
                        "tokenDecimals": 18,
                        "currentMultiplier": "1.000000000000000000",
                        "status": "ASSET_STATUS_ACTIVE",
                        "tradingCapabilities": {"market": {"fractional": "TRADING_STATUS_TRADABLE"}},
                    }
                ]
            }
        if url.endswith("/prices/AMZN"):
            return {
                "quotes": [
                    {
                        "tokenSymbol": "AMZN",
                        "deployments": [{"chainId": 31337}],
                        "bid": "100.00",
                        "ask": "100.10",
                        "currency": "USD",
                        "isTradingHalt": False,
                        "generatedAt": "2026-09-15T00:00:00Z",
                    }
                ]
            }
        raise AssertionError(url)

    def post_json(self, url, payload):
        method = payload["method"]
        self.rpc_methods.append(method)
        if method == "eth_chainId":
            result = hex(31337)
        elif method == "eth_blockNumber":
            result = hex(123)
        elif method == "eth_getBalance":
            result = "0x0"
        elif method == "eth_getCode":
            result = "0x6000"
        elif method == "eth_call":
            data = payload["params"][0]["data"]
            if data.startswith("0x313ce567"):
                result = hex(18)
            elif data.startswith("0x95d89b41"):
                result = abi_string("mAMZN")
            elif data.startswith("0x70a08231"):
                result = hex(42)
            else:
                raise AssertionError(data)
        else:
            raise AssertionError(method)
        return {"jsonrpc": "2.0", "id": payload["id"], "result": result}


class ProbeTests(unittest.TestCase):
    def config(self):
        return {
            "mode": "local-simulation",
            "rpc_url": "http://127.0.0.1:8545",
            "expected_chain_id": 31337,
            "wallet_address": ADDRESS_ZERO,
            "asset_registry_url": "https://example.test/assets",
            "price_url_template": "https://example.test/prices/{symbol}",
            "rest_price_max_age_seconds": 300,
            "asset": {"symbol": "AMZN", "contract_address": None},
            "feed": {"address": None, "max_age_seconds": 300},
            "quote": {"url": None},
        }

    def test_complete_read_only_probe(self):
        transport = FakeTransport()
        report = run_probe(
            self.config(), transport, now=datetime(2026, 9, 15, 0, 1, tzinfo=timezone.utc)
        )
        self.assertEqual("valid", report["checks"]["chain"]["status"])
        self.assertEqual("valid", report["checks"]["asset_contract"]["status"])
        self.assertEqual("valid", report["checks"]["rest_price"]["status"])
        self.assertEqual("unavailable", report["checks"]["price_feed"]["status"])
        self.assertEqual("unavailable", report["checks"]["quote"]["status"])
        self.assertEqual(
            {"eth_chainId", "eth_blockNumber", "eth_getBalance", "eth_getCode", "eth_call"},
            set(transport.rpc_methods),
        )

    def test_rpc_rejects_state_changing_method(self):
        with self.assertRaisesRegex(ProbeError, "not read-only allowlisted"):
            RpcClient("http://localhost:8545", FakeTransport()).call(
                "eth_sendRawTransaction", ["0xdeadbeef"]
            )

    def test_balance_encoding(self):
        encoded = encode_balance_of("0x" + "ab" * 20)
        self.assertEqual(2 + 8 + 64, len(encoded))
        self.assertTrue(encoded.endswith("ab" * 20))

    def test_dynamic_abi_string_decoding(self):
        self.assertEqual("AMZN", decode_abi_string(abi_string("AMZN")))

    def test_url_redaction(self):
        self.assertEqual(
            "https://rpc.example",
            safe_url("https://rpc.example/v2/path-secret?apiKey=query-secret"),
        )


if __name__ == "__main__":
    unittest.main()
