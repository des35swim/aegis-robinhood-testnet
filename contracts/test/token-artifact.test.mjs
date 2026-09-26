import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const artifact = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "build", "AegisGuardDogTest.json"), "utf8"),
);

const functions = artifact.abi
  .filter((entry) => entry.type === "function")
  .map((entry) => entry.name);

test("targets Robinhood Chain Testnet and is not marked deployed", () => {
  assert.equal(artifact.chainId, 46630);
  assert.equal(artifact.deploymentStatus, "not-deployed");
});

test("compiles deployable creation and runtime bytecode", () => {
  assert.match(artifact.bytecode, /^0x[0-9a-f]+$/i);
  assert.match(artifact.deployedBytecode, /^0x[0-9a-f]+$/i);
  assert.ok(artifact.bytecode.length > artifact.deployedBytecode.length);
});

test("exposes standard ERC-20 reads and transfers", () => {
  for (const name of ["name", "symbol", "decimals", "totalSupply", "balanceOf", "transfer", "approve", "allowance", "transferFrom"]) {
    assert.ok(functions.includes(name), `missing ${name}`);
  }
});

test("does not expose privileged token controls", () => {
  for (const forbidden of ["mint", "owner", "pause", "unpause", "blacklist", "upgradeTo", "setFee", "setTax"]) {
    assert.ok(!functions.includes(forbidden), `unexpected privileged function ${forbidden}`);
  }
});

test("requires one initial recipient address", () => {
  const constructor = artifact.abi.find((entry) => entry.type === "constructor");
  assert.deepEqual(constructor.inputs, [{ internalType: "address", name: "initialRecipient", type: "address" }]);
});
