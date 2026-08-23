"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");

const PORT = 3101;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let serverProcess;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(BASE_URL);

      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Test server did not start.");
}

async function post(path, body) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify(body),
  });
}

test.before(async () => {
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await waitForServer();
});

test.after(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }
});

test("dashboard is available only on the local test server", async () => {
  const response = await fetch(BASE_URL);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /MindNodeX Dashboard/);
  assert.match(html, /Sandbox only/i);
});

test("unknown routes return 404", async () => {
  const response = await fetch(`${BASE_URL}/not-a-real-route`);

  assert.equal(response.status, 404);
});

test("preview rejects an amount above the one-USDC limit", async () => {
  const response = await post("/api/transfers/validate", {
    amount: 1.01,
  });

  assert.equal(response.status, 400);
});

test("execution rejects an amount above the one-USDC limit", async () => {
  const response = await post("/api/transfers", {
    amount: 1.01,
    confirmation: "SANDBOX",
  });

  assert.equal(response.status, 400);
});

test("execution rejects an incorrect confirmation", async () => {
  const response = await post("/api/transfers", {
    amount: 0.5,
    confirmation: "sandbox",
  });

  assert.equal(response.status, 400);
});

test("config defaults to sandbox mode", () => {
  // Clear the module cache to ensure a fresh evaluation with current env vars.
  delete require.cache[require.resolve("./config")];
  const config = require("./config");

  assert.equal(config.mode, "sandbox");
  assert.equal(config.modeLabel, "Sandbox");
  assert.equal(config.isLive, false);
  assert.equal(config.confirmationWord, "SANDBOX");
  assert.equal(config.balanceEnv, "sandbox");
  assert.equal(config.transferListEnv, "sandbox-root");
  assert.equal(config.transferEnv, "sandbox-transfer");
  assert.equal(config.environmentLabel, "sandbox");
});

test("live mode config is populated when CDP_MODE=live and LIVE_ACCOUNT_ID is set", () => {
  // Exercise the config module in isolation without actually starting the server.
  // We do this by requiring the module in a child process that has the env vars set.
  const { execFileSync } = require("node:child_process");

  const output = execFileSync(
    process.execPath,
    [
      "-e",
      `
        const config = require("./config");
        console.log(JSON.stringify({
          mode: config.mode,
          modeLabel: config.modeLabel,
          isLive: config.isLive,
          confirmationWord: config.confirmationWord,
          balanceEnv: config.balanceEnv,
          transferListEnv: config.transferListEnv,
          transferEnv: config.transferEnv,
          environmentLabel: config.environmentLabel,
          accountId: config.accountId,
        }));
      `,
    ],
    {
      cwd: __dirname,
      env: {
        ...process.env,
        CDP_MODE: "live",
        LIVE_ACCOUNT_ID: "account_live-test-id",
      },
      encoding: "utf8",
    }
  );

  const liveConfig = JSON.parse(output.trim());

  assert.equal(liveConfig.mode, "live");
  assert.equal(liveConfig.modeLabel, "Live");
  assert.equal(liveConfig.isLive, true);
  assert.equal(liveConfig.confirmationWord, "LIVE");
  assert.equal(liveConfig.balanceEnv, "live");
  assert.equal(liveConfig.transferListEnv, "live-root");
  assert.equal(liveConfig.transferEnv, "live-transfer");
  assert.equal(liveConfig.environmentLabel, "live");
  assert.equal(liveConfig.accountId, "account_live-test-id");
});

test("live mode config refuses to start without LIVE_ACCOUNT_ID", () => {
  const { spawnSync } = require("node:child_process");

  const result = spawnSync(
    process.execPath,
    ["-e", "require('./config');"],
    {
      cwd: __dirname,
      env: {
        ...process.env,
        CDP_MODE: "live",
        LIVE_ACCOUNT_ID: "",
      },
      encoding: "utf8",
    }
  );

  assert.notEqual(result.status, 0, "Process should have exited with non-zero status");
  assert.match(result.stderr, /LIVE_ACCOUNT_ID/);
});
