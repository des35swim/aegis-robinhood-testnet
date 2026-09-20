#!/usr/bin/env python3
"""Strictly read-only connectivity probe for the governed RWA prototype."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol


ALLOWED_RPC_METHODS = frozenset(
    {
        "eth_blockNumber",
        "eth_call",
        "eth_chainId",
        "eth_getBalance",
        "eth_getCode",
    }
)
ADDRESS_ZERO = "0x" + ("0" * 40)
SELECTORS = {
    "balanceOf": "70a08231",
    "decimals": "313ce567",
    "symbol": "95d89b41",
    "latestRoundData": "feaf968c",
}


class ProbeError(RuntimeError):
    pass


class Transport(Protocol):
    def get_json(self, url: str) -> dict[str, Any]: ...

    def post_json(self, url: str, payload: dict[str, Any]) -> dict[str, Any]: ...


class UrlLibTransport:
    def __init__(self, timeout_seconds: int = 15) -> None:
        self.timeout_seconds = timeout_seconds

    def _request(self, request: urllib.request.Request) -> dict[str, Any]:
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                body = response.read().decode("utf-8")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise ProbeError(f"request failed for {safe_url(request.full_url)}: {exc}") from exc
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ProbeError(f"non-JSON response from {safe_url(request.full_url)}") from exc
        if not isinstance(parsed, dict):
            raise ProbeError(f"expected a JSON object from {safe_url(request.full_url)}")
        return parsed

    def get_json(self, url: str) -> dict[str, Any]:
        validate_url(url)
        return self._request(urllib.request.Request(url, method="GET"))

    def post_json(self, url: str, payload: dict[str, Any]) -> dict[str, Any]:
        validate_url(url)
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={"content-type": "application/json"},
        )
        return self._request(request)


def safe_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname or ""
    port = f":{parsed.port}" if parsed.port else ""
    # Provider credentials commonly appear in either the path (Alchemy) or
    # query string. Reporting only the origin avoids leaking either form.
    return urllib.parse.urlunsplit((parsed.scheme, f"{host}{port}", "", "", ""))


def validate_url(url: str) -> None:
    parsed = urllib.parse.urlsplit(url)
    if parsed.username or parsed.password:
        raise ProbeError("URLs containing credentials are forbidden")
    if parsed.scheme == "https" and parsed.hostname:
        return
    if parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost", "::1"}:
        return
    raise ProbeError("only HTTPS URLs or loopback HTTP URLs are permitted")


def validate_address(value: str, field: str) -> str:
    if not isinstance(value, str) or len(value) != 42 or not value.startswith("0x"):
        raise ProbeError(f"{field} must be a 20-byte 0x-prefixed address")
    try:
        int(value[2:], 16)
    except ValueError as exc:
        raise ProbeError(f"{field} is not hexadecimal") from exc
    return value.lower()


@dataclass
class RpcClient:
    url: str
    transport: Transport
    request_id: int = 0

    def call(self, method: str, params: list[Any]) -> Any:
        if method not in ALLOWED_RPC_METHODS:
            raise ProbeError(f"RPC method is not read-only allowlisted: {method}")
        self.request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params,
        }
        response = self.transport.post_json(self.url, payload)
        if response.get("error") is not None:
            raise ProbeError(f"RPC {method} failed: {response['error']}")
        if "result" not in response:
            raise ProbeError(f"RPC {method} returned no result")
        return response["result"]


def rpc_uint(value: Any, field: str) -> int:
    if not isinstance(value, str) or not value.startswith("0x"):
        raise ProbeError(f"{field} is not an RPC hex quantity")
    return int(value, 16)


def encode_balance_of(wallet_address: str) -> str:
    address = validate_address(wallet_address, "wallet_address")[2:]
    return "0x" + SELECTORS["balanceOf"] + address.rjust(64, "0")


def decode_abi_string(value: str) -> str:
    raw = bytes.fromhex(value.removeprefix("0x"))
    if len(raw) == 32:
        return raw.rstrip(b"\x00").decode("utf-8", errors="replace")
    if len(raw) < 64:
        raise ProbeError("ABI string result is too short")
    offset = int.from_bytes(raw[:32], "big")
    if offset + 32 > len(raw):
        raise ProbeError("ABI string offset is invalid")
    length = int.from_bytes(raw[offset : offset + 32], "big")
    return raw[offset + 32 : offset + 32 + length].decode("utf-8", errors="replace")


def decode_latest_round_data(value: str) -> dict[str, int]:
    raw = bytes.fromhex(value.removeprefix("0x"))
    if len(raw) < 160:
        raise ProbeError("latestRoundData result is too short")
    words = [raw[index : index + 32] for index in range(0, 160, 32)]
    unsigned = [int.from_bytes(word, "big") for word in words]
    answer = int.from_bytes(words[1], "big", signed=True)
    return {
        "round_id": unsigned[0],
        "answer": answer,
        "started_at": unsigned[2],
        "updated_at": unsigned[3],
        "answered_in_round": unsigned[4],
    }


def iso_age_seconds(value: str, now: datetime) -> int:
    timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        raise ProbeError("timestamp lacks timezone")
    return max(0, int((now - timestamp.astimezone(timezone.utc)).total_seconds()))


def status(state: str, **details: Any) -> dict[str, Any]:
    return {"status": state, **details}


def find_asset(payload: dict[str, Any], symbol: str, chain_id: int) -> dict[str, Any] | None:
    assets = payload.get("assets")
    if not isinstance(assets, list):
        raise ProbeError("asset registry response has no assets list")
    for asset in assets:
        if not isinstance(asset, dict) or asset.get("tokenSymbol") != symbol:
            continue
        deployments = asset.get("deployments", [])
        matching = [item for item in deployments if item.get("chainId") == chain_id]
        if matching:
            return {**asset, "deployment": matching[0]}
    return None


def call_contract(rpc: RpcClient, address: str, data: str) -> str:
    result = rpc.call("eth_call", [{"to": validate_address(address, "contract address"), "data": data}, "latest"])
    if not isinstance(result, str):
        raise ProbeError("eth_call returned a non-string result")
    return result


def run_probe(config: dict[str, Any], transport: Transport, now: datetime | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    expected_chain_id = int(config["expected_chain_id"])
    wallet_address = validate_address(config.get("wallet_address", ADDRESS_ZERO), "wallet_address")
    rpc = RpcClient(config["rpc_url"], transport)
    report: dict[str, Any] = {
        "probe_version": 1,
        "checked_at": now.isoformat(),
        "mode": config["mode"],
        "endpoints": {
            "rpc": safe_url(config["rpc_url"]),
            "asset_registry": safe_url(config["asset_registry_url"]),
        },
        "checks": {},
    }

    chain_id = rpc_uint(rpc.call("eth_chainId", []), "chain_id")
    report["checks"]["chain"] = status(
        "valid" if chain_id == expected_chain_id else "invalid",
        observed_chain_id=chain_id,
        expected_chain_id=expected_chain_id,
    )
    report["checks"]["latest_block"] = status(
        "valid", number=rpc_uint(rpc.call("eth_blockNumber", []), "block_number")
    )
    report["checks"]["native_balance"] = status(
        "valid",
        wallet_address=wallet_address,
        base_units=rpc_uint(rpc.call("eth_getBalance", [wallet_address, "latest"]), "balance"),
    )

    asset_config = config["asset"]
    symbol = asset_config["symbol"]
    registry_payload = transport.get_json(config["asset_registry_url"])
    asset = find_asset(registry_payload, symbol, expected_chain_id)
    configured_address = asset_config.get("contract_address")
    if asset is None:
        report["checks"]["asset_registry"] = status(
            "unavailable", symbol=symbol, reason="no deployment for expected chain"
        )
        contract_address = configured_address
    else:
        contract_address = asset["deployment"]["contractAddress"]
        report["checks"]["asset_registry"] = status(
            "valid",
            asset_id=asset.get("id"),
            symbol=symbol,
            name=asset.get("tokenName"),
            contract_address=contract_address,
            token_decimals=asset.get("tokenDecimals"),
            multiplier=asset.get("currentMultiplier"),
            asset_status=asset.get("status"),
            trading_capabilities=asset.get("tradingCapabilities"),
        )

    if contract_address:
        contract_address = validate_address(contract_address, "asset.contract_address")
        code = rpc.call("eth_getCode", [contract_address, "latest"])
        if not isinstance(code, str) or code in {"0x", "0x0"}:
            report["checks"]["asset_contract"] = status("invalid", reason="no contract bytecode")
        else:
            decimals = rpc_uint(call_contract(rpc, contract_address, "0x" + SELECTORS["decimals"]), "decimals")
            token_symbol = decode_abi_string(call_contract(rpc, contract_address, "0x" + SELECTORS["symbol"]))
            raw_balance = rpc_uint(call_contract(rpc, contract_address, encode_balance_of(wallet_address)), "token balance")
            report["checks"]["asset_contract"] = status(
                "valid",
                contract_address=contract_address,
                symbol=token_symbol,
                decimals=decimals,
                wallet_balance_base_units=raw_balance,
                bytecode_bytes=(len(code) - 2) // 2,
            )
    else:
        report["checks"]["asset_contract"] = status("unavailable", reason="no configured contract")

    price_url = config["price_url_template"].format(symbol=urllib.parse.quote(symbol, safe=""))
    report["endpoints"]["price"] = safe_url(price_url)
    price_payload = transport.get_json(price_url)
    quotes = price_payload.get("quotes", [])
    matching_quotes = [
        quote
        for quote in quotes
        if quote.get("tokenSymbol") == symbol
        and any(item.get("chainId") == expected_chain_id for item in quote.get("deployments", []))
    ]
    if matching_quotes:
        price = matching_quotes[0]
        age = iso_age_seconds(price["generatedAt"], now)
        max_age = int(config.get("rest_price_max_age_seconds", 300))
        price_state = "valid" if age <= max_age and not price.get("isTradingHalt") else "stale_or_halted"
        report["checks"]["rest_price"] = status(
            price_state,
            bid=price.get("bid"),
            ask=price.get("ask"),
            currency=price.get("currency"),
            generated_at=price.get("generatedAt"),
            age_seconds=age,
            maximum_age_seconds=max_age,
            trading_halt=price.get("isTradingHalt"),
        )
    else:
        report["checks"]["rest_price"] = status(
            "unavailable", reason="no price deployment for expected chain"
        )

    feed = config.get("feed", {})
    feed_address = feed.get("address")
    if feed_address:
        feed_address = validate_address(feed_address, "feed.address")
        decimals = rpc_uint(call_contract(rpc, feed_address, "0x" + SELECTORS["decimals"]), "feed decimals")
        round_data = decode_latest_round_data(
            call_contract(rpc, feed_address, "0x" + SELECTORS["latestRoundData"])
        )
        age = max(0, int(now.timestamp()) - round_data["updated_at"])
        max_age = int(feed["max_age_seconds"])
        valid = round_data["answer"] > 0 and round_data["updated_at"] > 0 and age <= max_age
        report["checks"]["price_feed"] = status(
            "valid" if valid else "invalid_or_stale",
            address=feed_address,
            decimals=decimals,
            age_seconds=age,
            maximum_age_seconds=max_age,
            **round_data,
        )
    else:
        report["checks"]["price_feed"] = status(
            "unavailable", reason="no verified feed address configured"
        )

    quote = config.get("quote", {})
    quote_url = quote.get("url")
    if quote_url:
        report["endpoints"]["quote"] = safe_url(quote_url)
        quote_payload = transport.get_json(quote_url)
        required = {"quoteId", "expiresAt", "chainId", "target", "calldata"}
        missing = sorted(required.difference(quote_payload))
        report["checks"]["quote"] = status(
            "unverified" if not missing else "invalid",
            reason="signature and venue allowlist verification are not implemented in Phase 0",
            missing_fields=missing,
        )
    else:
        report["checks"]["quote"] = status(
            "unavailable", reason="no approved testnet quote endpoint configured"
        )

    return report


def load_config(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ProbeError(f"cannot load config {path}: {exc}") from exc
    required = {
        "mode",
        "rpc_url",
        "expected_chain_id",
        "wallet_address",
        "asset_registry_url",
        "price_url_template",
        "asset",
    }
    missing = sorted(required.difference(value))
    if missing:
        raise ProbeError(f"config is missing keys: {', '.join(missing)}")
    return value


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--compact", action="store_true")
    args = parser.parse_args(argv)
    try:
        report = run_probe(load_config(args.config), UrlLibTransport())
    except (ProbeError, KeyError, TypeError, ValueError) as exc:
        print(json.dumps({"status": "probe_failed", "error": str(exc)}), file=sys.stderr)
        return 2
    print(json.dumps(report, indent=None if args.compact else 2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
