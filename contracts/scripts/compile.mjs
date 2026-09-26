import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import solc from "solc";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "src", "AegisGuardDogTest.sol");
const outputDirectory = path.join(projectRoot, "build");

function resolveImport(importPath) {
  const resolved = path.join(projectRoot, "node_modules", importPath);
  if (!fs.existsSync(resolved)) return { error: `Import not found: ${importPath}` };
  return { contents: fs.readFileSync(resolved, "utf8") };
}

const input = {
  language: "Solidity",
  sources: {
    "AegisGuardDogTest.sol": { content: fs.readFileSync(sourcePath, "utf8") },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "metadata"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));
const errors = (output.errors ?? []).filter((entry) => entry.severity === "error");
if (errors.length > 0) {
  for (const error of errors) console.error(error.formattedMessage);
  process.exit(1);
}

const compiled = output.contracts["AegisGuardDogTest.sol"].AegisGuardDogTest;
const artifact = {
  contractName: "AegisGuardDogTest",
  sourceName: "AegisGuardDogTest.sol",
  compilerVersion: solc.version(),
  chainId: 46630,
  deploymentStatus: "not-deployed",
  abi: compiled.abi,
  bytecode: `0x${compiled.evm.bytecode.object}`,
  deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
  metadata: JSON.parse(compiled.metadata),
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "AegisGuardDogTest.json"), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Compiled ${artifact.contractName} with ${artifact.compilerVersion}`);
