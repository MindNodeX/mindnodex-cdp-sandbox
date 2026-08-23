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
- Live-mode guardrail requiring `CDP_MODE=live`, `ENABLE_LIVE=true`, and `LIVE_ACCOUNT_ID`

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
- live-mode enablement when `CDP_MODE=live`, `ENABLE_LIVE=true`, and `LIVE_ACCOUNT_ID` are present
- live-mode refusal when any required live variable is missing

## Configuration

Configuration is handled through `config.js` and environment variables.

### Sandbox mode

Sandbox mode is the default runtime path.

```bash
CDP_MODE=sandbox
```

### Live mode

Live mode is intentionally locked behind explicit configuration.

To enable live mode, set all of the following:

```bash
CDP_MODE=live
ENABLE_LIVE=true
LIVE_ACCOUNT_ID=your_live_account_id
```

If any of those values are missing, the app must stay out of live mode.

Live mode is meant for production use only. Keep live credentials separate from sandbox credentials.

## Environment files

This repo includes `.env.example` as a safe starting point.

To set up local configuration:

```bash
cp .env.example .env
```

Then edit `.env` with your sandbox values first.

Keep live mode disabled until you are ready and have set:

```bash
CDP_MODE=live
ENABLE_LIVE=true
LIVE_ACCOUNT_ID=your_live_account_id
```

Never commit `.env` or secret files.

## Recommended live-mode design

If you extend this repo for live usage, keep the separation strict:

1. Use separate sandbox and live credentials.
2. Keep live mode behind explicit environment flags.
3. Require `CDP_MODE=live`.
4. Require `ENABLE_LIVE=true`.
5. Require `LIVE_ACCOUNT_ID` before allowing any live transfer path.
6. Keep live-only secrets out of your sandbox `.env` file.
7. Add tests that verify live mode cannot be enabled by accident.

## Project structure

- `index.js` — CLI entrypoint
- `server.js` — server entrypoint
- `config.js` — shared runtime configuration
- `test_server.js` — server and config tests

## Security notes

- Never commit API keys, private wallet files, or PATs.
- Keep any secret material outside version control.
- Treat live credentials as production-only data.
- Never reuse sandbox keys in live mode.
- Do not store secrets in the repo.

## License

ISC
