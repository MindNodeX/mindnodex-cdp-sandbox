# MindNodeX CDP Sandbox

Sandbox-only Coinbase CDP dashboard for testing balances and simulated transfers with a separate path reserved for future live mode.

## What this does

This project gives you a small dashboard and test harness for working with Coinbase CDP in sandbox mode.

It is designed to:

- show dashboard content only from the local test server
- reject unknown routes with a 404
- enforce the one-USDC limit in preview and execution flows
- keep sandbox mode as the default
- allow live mode only when `LIVE_ACCOUNT_ID` is explicitly set

## Requirements

- Node.js 18+ recommended
- npm
- A valid Coinbase CDP setup for sandbox usage

## Install

```bash
npm install
```

## Run

Start the server:

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

The tests verify:

- dashboard access on the local test server
- 404 handling for unknown routes
- preview limit checks
- execution limit checks
- confirmation validation
- sandbox/live config behavior

## Configuration

Configuration is handled through `config.js` and environment variables.

### Sandbox mode

Sandbox mode is the default.

### Live mode

Live mode only turns on when `LIVE_ACCOUNT_ID` is set.

If `LIVE_ACCOUNT_ID` is missing, live mode should be refused.

## Files

- `index.js` - CLI entrypoint
- `server.js` - server entrypoint
- `config.js` - shared configuration
- `test_server.js` - test coverage for server behavior

## Notes

This repo is intentionally set up as a sandbox first. Keep sensitive files private and avoid committing secrets.

## License

ISC
