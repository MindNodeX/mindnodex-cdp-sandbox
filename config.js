"use strict";

const mode = (process.env.CDP_MODE || "sandbox").toLowerCase();
const enableLive = process.env.ENABLE_LIVE === "true";
const liveAccountId = process.env.LIVE_ACCOUNT_ID;

const isLive = mode === "live";

if (isLive && (!enableLive || !liveAccountId)) {
  console.error(
    "[FATAL] Live mode requires CDP_MODE=live, ENABLE_LIVE=true, and LIVE_ACCOUNT_ID to be set."
  );
  process.exit(1);
}

const sandboxAccountId =
  process.env.ACCOUNT_ID || "account_2fccb8de-2e2f-4742-92f7-547451794f9a";

module.exports = {
  mode,
  enableLive,
  isLive,
  modeLabel: isLive ? "LIVE" : "SANDBOX",
  accountId: isLive ? liveAccountId : sandboxAccountId,
  balanceEnv: isLive ? "live" : "sandbox",
  transferListEnv: isLive ? "live-root" : "sandbox-root",
  transferEnv: isLive ? "live-transfer" : "sandbox-transfer",
  confirmationWord: isLive ? "LIVE" : "SANDBOX",
  environmentLabel: isLive ? "live" : "sandbox",
};
