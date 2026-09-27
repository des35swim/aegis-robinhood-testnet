import importlib.util
import json
import os
import pathlib
import sys
import types
import unittest


class FakeTable:
    def __init__(self):
        self.items = []

    def put_item(self, *, Item):
        self.items.append(Item)


TABLE = FakeTable()
fake_boto3 = types.ModuleType("boto3")
fake_boto3.resource = lambda _service: types.SimpleNamespace(Table=lambda _name: TABLE)
sys.modules["boto3"] = fake_boto3

handler_path = pathlib.Path(__file__).parents[1] / "lambda" / "feedback" / "handler.py"
spec = importlib.util.spec_from_file_location("feedback_handler", handler_path)
feedback_handler = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(feedback_handler)


class FeedbackHandlerTest(unittest.TestCase):
    def setUp(self):
        TABLE.items.clear()
        os.environ["TABLE_NAME"] = "feedback-test"
        os.environ["ALLOWED_ORIGIN"] = "https://demo.example"
        os.environ["RETENTION_DAYS"] = "365"

    def test_accepts_a_valid_anonymous_response(self):
        event = {
            "body": json.dumps(
                {
                    "responseId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
                    "reaction": "try",
                    "featureVote": "policies",
                    "note": "Useful concept",
                }
            )
        }

        response = feedback_handler.handle(event, None)

        self.assertEqual(response["statusCode"], 202)
        self.assertEqual(len(TABLE.items), 1)
        self.assertEqual(TABLE.items[0]["featureVote"], "policies")
        self.assertNotIn("email", TABLE.items[0])
        self.assertNotIn("wallet", TABLE.items[0])

    def test_rejects_unknown_options(self):
        event = {
            "body": json.dumps(
                {
                    "responseId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
                    "reaction": ["try"],
                    "featureVote": "moon-token",
                }
            )
        }

        response = feedback_handler.handle(event, None)

        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(TABLE.items, [])

    def test_rejects_oversized_requests(self):
        response = feedback_handler.handle({"body": "x" * 4097}, None)
        self.assertEqual(response["statusCode"], 413)
        self.assertEqual(TABLE.items, [])


if __name__ == "__main__":
    unittest.main()
