"use strict";

const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const runFile = promisify(execFile);

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);

const ACCOUNT_ID =
  process.env.ACCOUNT_ID ||
  "account_2fccb8de-2e2f-4742-92f7-547451794f9a";

const ASSETS = ["usd", "usdc"];
const HTML_FILE = path.join(__dirname, "public", "index.html");

async function getBalance(asset) {
  const { stdout } = await runFile(
    "cdp",
    [
      "api",
      `/accounts/${ACCOUNT_ID}/balances/${asset}`,
      "-e",
      "sandbox",
    ],
    {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    }
  );

  const data = JSON.parse(stdout);
  const symbol = data.asset?.symbol || asset.toUpperCase();
  const amount = data.amount?.[symbol] || {};

  return {
    asset: symbol,
    available: amount.available || "0",
    total: amount.total || "0",
  };
}

async function getTransfers() {
  const { stdout } = await runFile(
    "cdp",
    ["api", "/platform/v2/transfers", "-e", "sandbox-root"],
    {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    }
  );

  const data = JSON.parse(stdout);
  return Array.isArray(data.transfers) ? data.transfers : [];
}

async function createSandboxTransfer(amount) {
  const { stdout } = await runFile(
    "cdp",
    [
      "api",
      "-X",
      "POST",
      "/platform/v2/transfers",
      "-e",
      "sandbox-transfer",
      `source.accountId=${ACCOUNT_ID}`,
      "source.asset=usdc",
      "target.network=base",
      "target.address=0x1111111111111111111111111111111111111111",
      "target.asset=usdc",
      `amount=${amount.toFixed(2)}`,
      "asset=usdc",
      "execute:=true",
    ],
    {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

async function validateSandboxTransfer(amount) {
  const { stdout } = await runFile(
    "cdp",
    [
      "api",
      "-X",
      "POST",
      "/platform/v2/transfers",
      "-e",
      "sandbox-transfer",
      `source.accountId=${ACCOUNT_ID}`,
      "source.asset=usdc",
      "target.network=base",
      "target.address=0x1111111111111111111111111111111111111111",
      "target.asset=usdc",
      `amount=${amount.toFixed(2)}`,
      "asset=usdc",
      "validateOnly:=true",
      "execute:=false",
    ],
    {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 4096) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const error = new Error("Request body must be valid JSON.");
        error.statusCode = 400;
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (
    request.method === "POST" &&
    url.pathname === "/api/transfers/validate"
  ) {
    const allowedOrigin = `http://${HOST}:${PORT}`;
    const origin = request.headers.origin;

    if (origin && origin !== allowedOrigin) {
      sendJson(response, 403, {
        error: "Request origin is not allowed.",
      });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const amount = Number(body.amount);

      if (!Number.isFinite(amount) || amount < 0.01 || amount > 1) {
        sendJson(response, 400, {
          error: "Sandbox transfer amount must be between 0.01 and 1.00 USDC.",
        });
        return;
      }

      const quote = await validateSandboxTransfer(amount);

      sendJson(response, 200, {
        environment: "sandbox",
        simulated: true,
        quote,
      });
    } catch (error) {
      console.error(error.stderr || error.message);
      sendJson(response, error.statusCode || 502, {
        error:
          error.statusCode && error.statusCode < 500
            ? error.message
            : "Coinbase Sandbox transfer validation failed.",
      });
    }

    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/transfers"
  ) {
    const allowedOrigin = `http://${HOST}:${PORT}`;
    const origin = request.headers.origin;

    if (origin && origin !== allowedOrigin) {
      sendJson(response, 403, {
        error: "Request origin is not allowed.",
      });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const amount = Number(body.amount);

      if (body.confirmation !== "SANDBOX") {
        sendJson(response, 400, {
          error: "Type SANDBOX to confirm this simulated transfer.",
        });
        return;
      }

      if (!Number.isFinite(amount) || amount < 0.01 || amount > 1) {
        sendJson(response, 400, {
          error: "Sandbox transfer amount must be between 0.01 and 1.00 USDC.",
        });
        return;
      }

      const transfer = await createSandboxTransfer(amount);

      sendJson(response, 201, {
        environment: "sandbox",
        simulated: true,
        transfer,
      });
    } catch (error) {
      console.error(error.stderr || error.message);
      sendJson(response, error.statusCode || 502, {
        error:
          error.statusCode && error.statusCode < 500
            ? error.message
            : "Coinbase Sandbox transfer request failed.",
      });
    }

    return;
  }

  if (request.method === "GET" && url.pathname === "/api/transfers") {
    try {
      const transfers = (await getTransfers()).filter(
        (transfer) =>
          transfer.source?.accountId === ACCOUNT_ID ||
          transfer.target?.accountId === ACCOUNT_ID
      );

      sendJson(response, 200, {
        accountId: ACCOUNT_ID,
        environment: "sandbox",
        updatedAt: new Date().toISOString(),
        transfers,
      });
    } catch (error) {
      console.error(error.stderr || error.message);
      sendJson(response, 502, {
        error: "Coinbase Sandbox transfer request failed.",
      });
    }

    return;
  }

  if (request.method === "GET" && url.pathname === "/api/balances") {
    try {
      const balances = await Promise.all(ASSETS.map(getBalance));

      sendJson(response, 200, {
        accountId: ACCOUNT_ID,
        environment: "sandbox",
        updatedAt: new Date().toISOString(),
        balances,
      });
    } catch (error) {
      console.error(error.stderr || error.message);
      sendJson(response, 502, {
        error: "Coinbase Sandbox balance request failed.",
      });
    }

    return;
  }

  if (
    request.method === "GET" &&
    (url.pathname === "/" || url.pathname === "/index.html")
  ) {
    try {
      const html = await fs.readFile(HTML_FILE);

      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy":
          "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
      });

      response.end(html);
    } catch (error) {
      sendJson(response, 500, {
        error: "Dashboard interface could not be loaded.",
      });
    }

    return;
  }

  sendJson(response, 404, { error: "Not found." });
});

server.listen(PORT, HOST, () => {
  console.log("\nMindNodeX CDP Sandbox Web Dashboard");
  console.log(`Open: http://${HOST}:${PORT}`);
  console.log("SANDBOX ONLY — no real funds are connected.\n");
});
