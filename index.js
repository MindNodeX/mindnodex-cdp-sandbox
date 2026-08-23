"use strict";

const { execFileSync } = require("node:child_process");
const config = require("./config");

const ASSETS = ["usd", "usdc"];
const accountSource = config.isLive
  ? "LIVE_ACCOUNT_ID"
  : process.env.ACCOUNT_ID
    ? "ACCOUNT_ID"
    : "default sandbox account";

function getBalance(asset) {
  try {
    const output = execFileSync(
      "cdp",
      [
        "api",
        `/accounts/${config.accountId}/balances/${asset}`,
        "-e",
        config.balanceEnv,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    const data = JSON.parse(output);
    const symbol = data.asset?.symbol || asset.toUpperCase();
    const balance = data.amount?.[symbol] || {};

    return {
      Asset: symbol,
      Available: balance.available || "0",
      Total: balance.total || "0",
    };
  } catch (error) {
    const message =
      error.stderr?.toString().trim() || error.message || "Unknown error";

    return {
      Asset: asset.toUpperCase(),
      Available: "ERROR",
      Total: message,
    };
  }
}

console.log(`\nMindNodeX CDP ${config.modeLabel} Dashboard`);
console.log(`Account: configured via ${accountSource}\n`);
console.table(ASSETS.map(getBalance));
if (config.isLive) {
  console.log("LIVE MODE — real account settings are active.\n");
} else {
  console.log("SANDBOX ONLY — no real funds are connected.\n");
}
