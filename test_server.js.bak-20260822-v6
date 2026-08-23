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
