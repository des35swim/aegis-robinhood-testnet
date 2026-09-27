import json
import os
import re
import time
from typing import Any

import boto3


REACTIONS = {"try", "explore", "work", "no"}
FEATURES = {"wallet", "walkthrough", "policies", "teams", "other"}
RESPONSE_ID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.IGNORECASE)


def _response(status: int, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-store",
            "access-control-allow-origin": os.environ["ALLOWED_ORIGIN"],
            "vary": "origin",
        },
        "body": json.dumps(body, separators=(",", ":")),
    }


def _validate(payload: Any) -> tuple[dict[str, str] | None, str | None]:
    if not isinstance(payload, dict):
        return None, "body must be a JSON object"

    response_id = payload.get("responseId")
    reaction = payload.get("reaction")
    feature_vote = payload.get("featureVote")
    note = payload.get("note", "")

    if not isinstance(response_id, str) or not RESPONSE_ID.fullmatch(response_id):
        return None, "responseId must be a UUID"
    if not isinstance(reaction, str) or reaction not in REACTIONS:
        return None, "reaction is invalid"
    if not isinstance(feature_vote, str) or feature_vote not in FEATURES:
        return None, "featureVote is invalid"
    if not isinstance(note, str) or len(note) > 500:
        return None, "note must contain at most 500 characters"

    return {
        "responseId": response_id.lower(),
        "reaction": reaction,
        "featureVote": feature_vote,
        "note": note.strip(),
    }, None


def handle(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    body = event.get("body") or ""
    if not isinstance(body, str):
        return _response(400, {"status": "rejected", "error": "body must be valid JSON"})
    if len(body.encode("utf-8")) > 4096:
        return _response(413, {"status": "rejected", "error": "request is too large"})

    try:
        payload = json.loads(body)
    except (TypeError, json.JSONDecodeError):
        return _response(400, {"status": "rejected", "error": "body must be valid JSON"})

    response, error = _validate(payload)
    if error or response is None:
        return _response(400, {"status": "rejected", "error": error})

    now = int(time.time())
    retention_days = int(os.environ.get("RETENTION_DAYS", "365"))
    item = {
        **response,
        "submittedAt": now,
        "expiresAt": now + retention_days * 86400,
        "schemaVersion": 1,
    }

    table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
    table.put_item(Item=item)
    return _response(202, {"status": "accepted", "responseId": response["responseId"]})
