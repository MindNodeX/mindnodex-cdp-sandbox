# MindNodeX CDP Sandbox

A sandbox-first Coinbase CDP dashboard for testing balances, previewing actions, and running simulated transfers without touching live funds unless you explicitly opt in.

## What this is

This repo is built for one job: keep the sandbox flow clean, safe, and testable.

It includes:

- a local dashboard server
- route handling for the sandbox UI
- preview and execution checks with a one-USDC limit
- config behavior that defaults to sandbox mode
- a live-mode path that only unlocks when `LIVE_ACCOUNT_ID` is set

## Why it exists

The point is simple:

1. test the sandbox flow first
2. keep the live path separated
3. avoid accidental transfers
4. make the behavior easy to verify with automated tests

## Requirements

- Node.js 18+ recommended
- npm
- Coinbase CDP sandbox credentials, if your local setup needs them

## Install

```bash
npm install
```

## Run

Start the app:

```bash
npm start
```

Run the CLI entrypoint:

```bash
npm run cli
```

## Test

Run the test suite:

```bash
npm test
```

Current coverage checks:

- dashboard is only available on the local test server
- unknown routes return 404
- preview rejects amounts above the one-USDC limit
- execution rejects amounts above the one-USDC limit
- execution rejects incorrect confirmation
- config defaults to sandbox mode
- config enables live mode when `LIVE_ACCOUNT_ID` is set
- config refuses live mode without `LIVE_ACCOUNT_ID`

## Configuration

Configuration lives in `config.js` and environment variables.

### Sandbox mode

Sandbox mode is the default.

### Live mode

Live mode only turns on when `LIVE_ACCOUNT_ID` is set.

If that value is missing, the app should stay out of live mode.

## Project files

- `index.js` — CLI entrypoint
- `server.js` — server entrypoint
- `config.js` — shared configuration
- `test_server.js` — server and config tests

## Notes

- Keep secrets out of the repo.
- Treat private wallet or token files like sensitive data.
- Use the sandbox path for testing unless you are deliberately switching to live mode.

## License

ISC
