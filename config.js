"use strict";

// ---------------------------------------------------------------------------
// Mode configuration
//
// Set CDP_MODE=live to enable live mode. Any other value (or unset) defaults
// to sandbox. Live mode requires explicit env vars for the live account and
// uses different CDP endpoint names. Sandbox mode is the safe default and
// remains fully unchanged.
// ---------------------------------------------------------------------------

const CDP_MODE = process.env.CDP_MODE === "live" ? "live" : "sandbox";

const SANDBOX_ACCOUNT_ID =
  process.env.ACCOUNT_ID || "account_2fccb8de-2e2f-4742-92f7-547451794f9a";

const LIVE_ACCOUNT_ID = process.env.LIVE_ACCOUNT_ID || "";

if (CDP_MODE === "live" && !LIVE_ACCOUNT_ID) {
  console.error(
    "[FATAL] CDP_MODE=live requires LIVE_ACCOUNT_ID to be set. " +
      "Refusing to start with a missing live account identifier."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Per-mode values
// ---------------------------------------------------------------------------

const CONFIGS = {
  sandbox: {
    mode: "sandbox",
    modeLabel: "Sandbox",
    accountId: SANDBOX_ACCOUNT_ID,
    // CDP CLI -e flag values used by each operation
    balanceEnv: "sandbox",
    transferListEnv: "sandbox-root",
    transferEnv: "sandbox-transfer",
    // Confirmation word required to execute a transfer
    confirmationWord: "SANDBOX",
    // Human-readable label returned in API responses
    environmentLabel: "sandbox",
    // Safety flag — live mode only
    isLive: false,
  },
  live: {
    mode: "live",
    modeLabel: "Live",
    accountId: LIVE_ACCOUNT_ID,
    balanceEnv: "live",
    transferListEnv: "live-root",
    transferEnv: "live-transfer",
    // Explicit, uppercase word that must be typed to confirm a real transfer
    confirmationWord: "LIVE",
    environmentLabel: "live",
    isLive: true,
  },
};

const config = CONFIGS[CDP_MODE];

module.exports = config;
