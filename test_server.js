"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
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
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `
        delete process.env.CDP_MODE;
        delete process.env.LIVE_ACCOUNT_ID;
        const config = require("./config");
        console.log(JSON.stringify(config));
      `,
    ],
    {
      cwd: __dirname,
      encoding: "utf8",
      env: process.env,
    }
  );

  assert.equal(result.status, 0);

  const config = JSON.parse(result.stdout.trim());
  assert.equal(config.mode, "sandbox");
  assert.equal(config.isLive, false);
  assert.equal(config.modeLabel, "SANDBOX");
  assert.equal(config.accountId, "account_2fccb8de-2e2f-4742-92f7-547451794f9a");
  assert.equal(config.balanceEnv, "sandbox");
  assert.equal(config.transferListEnv, "sandbox-root");
  assert.equal(config.transferEnv, "sandbox-transfer");
  assert.equal(config.confirmationWord, "SANDBOX");
  assert.equal(config.environmentLabel, "sandbox");
});

test("config enables live mode when LIVE_ACCOUNT_ID is set", () => {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `
        const config = require("./config");
        console.log(JSON.stringify(config));
      `,
    ],
    {
      cwd: __dirname,
      encoding: "utf8",
      env: {
        ...process.env,
        CDP_MODE: "live",
        LIVE_ACCOUNT_ID: "account_live_123",
      },
    }
  );

  assert.equal(result.status, 0);

  const config = JSON.parse(result.stdout.trim());
  assert.equal(config.mode, "live");
  assert.equal(config.isLive, true);
  assert.equal(config.modeLabel, "LIVE");
  assert.equal(config.accountId, "account_live_123");
  assert.equal(config.balanceEnv, "live");
  assert.equal(config.transferListEnv, "live-root");
  assert.equal(config.transferEnv, "live-transfer");
  assert.equal(config.confirmationWord, "LIVE");
  assert.equal(config.environmentLabel, "live");
});

test("config refuses live mode without LIVE_ACCOUNT_ID", () => {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `
        require("./config");
      `,
    ],
    {
      cwd: __dirname,
      encoding: "utf8",
      env: {
        ...process.env,
        CDP_MODE: "live",
        LIVE_ACCOUNT_ID: "",
      },
    }
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stderr || ""}${result.stdout || ""}`,
    /CDP_MODE=live requires LIVE_ACCOUNT_ID/
  );
});
