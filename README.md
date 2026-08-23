# MindNodeX CDP Sandbox

[![Node.js CI](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue)](./package.json)

A sandbox-first Coinbase CDP dashboard for testing balances, previewing transfers, and validating execution flows without touching live funds unless live mode is explicitly enabled.

## Overview

This repository is intentionally built around a safe default:

- **Sandbox mode** is the default runtime path.
- **Live mode** is locked behind explicit configuration.
- The test suite verifies route handling, transfer limits, and config behavior.

The goal is simple: keep the sandbox flow predictable, keep the live path isolated, and make every important behavior testable.

## Features

- Local dashboard server for sandbox workflows
- Route handling with 404 protection for unknown paths
- Preview and execution checks with a one-USDC limit
- Shared config module for server and CLI entrypoints
- Sandbox-first config behavior
- Live-mode guardrail requiring `LIVE_ACCOUNT_ID`

## Requirements

- Node.js 18 or newer
- npm
- Coinbase CDP sandbox credentials for local testing

## Installation

```bash
npm install
```

## Running the app

Start the app:

```bash
npm start
```

Run the CLI entrypoint:

```bash
npm run cli
```

## Testing

Run the test suite:

```bash
npm test
```

The current tests cover:

- dashboard availability on the local test server
- 404 handling for unknown routes
- preview rejection above the one-USDC limit
- execution rejection above the one-USDC limit
- incorrect confirmation handling
- sandbox-mode default behavior
- live-mode enablement when `LIVE_ACCOUNT_ID` is present
- live-mode refusal when `LIVE_ACCOUNT_ID` is missing

## Configuration

Configuration is handled through `config.js` and environment variables.

### Sandbox mode

Sandbox mode is the default. If no live-specific environment variables are present, the app should stay in sandbox behavior.

### Live mode

Live mode should only activate when the app is intentionally configured for production use.

Minimum live guardrail currently enforced by tests:

```bash
LIVE_ACCOUNT_ID=your_live_account_id
```

If `LIVE_ACCOUNT_ID` is not present, live mode must be refused.

## Recommended live-mode design

If you plan to extend this repo for live usage, keep the separation strict:

1. Use separate sandbox and live credentials.
2. Keep live config behind explicit environment flags.
3. Require `LIVE_ACCOUNT_ID` before allowing any live transfer path.
4. Add a second safety flag if you want extra protection, such as `ENABLE_LIVE=true`.
5. Keep live-only secrets out of your sandbox `.env` file.

## Project structure

- `index.js` — CLI entrypoint
- `server.js` — server entrypoint
- `config.js` — shared runtime configuration
- `test_server.js` — server and config tests

## Security notes

- Never commit API keys, private wallet files, or PATs.
- Keep any secret material outside version control.
- Treat live credentials as production-only data.

## License

ISC
