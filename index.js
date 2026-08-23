"use strict";

const { execFileSync } = require("node:child_process");

const ACCOUNT_ID =
  process.env.ACCOUNT_ID ||
  "account_2fccb8de-2e2f-4742-92f7-547451794f9a";

const ASSETS = ["usd", "usdc"];

function getBalance(asset) {
  try {
    const output = execFileSync(
      "cdp",
      [
        "api",
        `/accounts/${ACCOUNT_ID}/balances/${asset}`,
        "-e",
        "sandbox",
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

console.log("\nMindNodeX CDP Sandbox Dashboard");
console.log(`Account: ${ACCOUNT_ID}\n`);
console.table(ASSETS.map(getBalance));
console.log("SANDBOX ONLY — no real funds are connected.\n");
