#!/usr/bin/env node
/**
 * Verifies that server.json stays in sync with package.json so the MCP
 * Registry manifest never drifts from what's actually published to npm:
 *   - package.json#mcpName === server.json#name
 *   - package.json#version === server.json#version
 *   - package.json#version === server.json#packages[0].version
 *
 * Note: description text is intentionally NOT checked for equality.
 * The Official MCP Registry rejects any server.json#description over
 * 100 characters (HTTP 422), so server.json carries a shortened variant
 * while package.json/README carry the fuller marketing copy.
 *
 * Run automatically in CI before publishing (see .github/workflows/release.yml).
 * Run locally with `npm run verify:mcp`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(fileURLToPath(import.meta.url), '../..');

function readJson(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

const pkg = readJson('package.json');
const server = readJson('server.json');

const errors = [];

const MAX_REGISTRY_DESCRIPTION_LENGTH = 100;
if (
  typeof server.description === 'string' &&
  server.description.length > MAX_REGISTRY_DESCRIPTION_LENGTH
) {
  errors.push(
    `server.json#description is ${server.description.length} characters, but the Official MCP ` +
      `Registry rejects descriptions over ${MAX_REGISTRY_DESCRIPTION_LENGTH} (HTTP 422).`,
  );
}

if (!pkg.mcpName) {
  errors.push('package.json is missing "mcpName".');
} else if (pkg.mcpName !== server.name) {
  errors.push(
    `package.json#mcpName ("${pkg.mcpName}") does not match server.json#name ("${server.name}").`,
  );
}

if (pkg.version !== server.version) {
  errors.push(
    `package.json#version ("${pkg.version}") does not match server.json#version ("${server.version}").`,
  );
}

const npmPackageEntry = (server.packages ?? []).find((p) => p.registryType === 'npm');
if (!npmPackageEntry) {
  errors.push('server.json has no npm entry under "packages".');
} else if (npmPackageEntry.version !== pkg.version) {
  errors.push(
    `server.json npm package version ("${npmPackageEntry.version}") does not match package.json#version ("${pkg.version}").`,
  );
} else if (npmPackageEntry.identifier !== pkg.name) {
  errors.push(
    `server.json npm package identifier ("${npmPackageEntry.identifier}") does not match package.json#name ("${pkg.name}").`,
  );
}

if (errors.length > 0) {
  console.error('MCP manifest verification failed:\n');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error(
    '\nUpdate server.json (or package.json#mcpName) so both files describe the same release.',
  );
  process.exit(1);
}

console.log(
  `MCP manifest OK: ${pkg.mcpName} @ ${pkg.version} matches server.json and package.json.`,
);
