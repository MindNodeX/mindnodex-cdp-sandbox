 "use strict";
 
 const test = require("node:test");
 const assert = require("node:assert/strict");
+const { spawnSync } = require("node:child_process");
 const { spawn } = require("node:child_process");
@@
 test("execution rejects an incorrect confirmation", async () => {
   const response = await post("/api/transfers", {
     amount: 0.5,
     confirmation: "sandbox",
   });
 
   assert.equal(response.status, 400);
 });
+
+test("config defaults to sandbox mode", () => {
+  const result = spawnSync(
+    process.execPath,
+    [
+      "-e",
+      `
+        process.env.PORT = "3102";
+        delete process.env.CDP_MODE;
+        delete process.env.LIVE_ACCOUNT_ID;
+        const config = require("./config");
+        console.log(JSON.stringify(config));
+      `,
+    ],
+    {
+      cwd: __dirname,
+      encoding: "utf8",
+      env: {
+        ...process.env,
+        PORT: "3102",
+      },
+    }
+  );
+
+  assert.equal(result.status, 0);
+  const config = JSON.parse(result.stdout.trim());
+  assert.equal(config.mode, "sandbox");
+  assert.equal(config.isLive, false);
+  assert.equal(config.modeLabel, "SANDBOX");
+  assert.equal(config.accountId, "account_2fccb8de-2e2f-4742-92f7-547451794f9a");
+  assert.equal(config.balanceEnv, "sandbox");
+  assert.equal(config.transferListEnv, "sandbox-root");
+  assert.equal(config.transferEnv, "sandbox-transfer");
+  assert.equal(config.confirmationWord, "SANDBOX");
+  assert.equal(config.environmentLabel, "sandbox");
+});
+
+test("config enables live mode when LIVE_ACCOUNT_ID is set", () => {
+  const result = spawnSync(
+    process.execPath,
+    [
+      "-e",
+      `
+        process.env.CDP_MODE = "live";
+        process.env.LIVE_ACCOUNT_ID = "account_live_123";
+        const config = require("./config");
+        console.log(JSON.stringify(config));
+      `,
+    ],
+    {
+      cwd: __dirname,
+      encoding: "utf8",
+      env: {
+        ...process.env,
+        CDP_MODE: "live",
+        LIVE_ACCOUNT_ID: "account_live_123",
+      },
+    }
+  );
+
+  assert.equal(result.status, 0);
+  const config = JSON.parse(result.stdout.trim());
+  assert.equal(config.mode, "live");
+  assert.equal(config.isLive, true);
+  assert.equal(config.modeLabel, "LIVE");
+  assert.equal(config.accountId, "account_live_123");
+  assert.equal(config.balanceEnv, "live");
+  assert.equal(config.transferListEnv, "live-root");
+  assert.equal(config.transferEnv, "live-transfer");
+  assert.equal(config.confirmationWord, "LIVE");
+  assert.equal(config.environmentLabel, "live");
+});
+
+test("config refuses live mode without LIVE_ACCOUNT_ID", () => {
+  const result = spawnSync(
+    process.execPath,
+    [
+      "-e",
+      `
+        process.env.CDP_MODE = "live";
+        delete process.env.LIVE_ACCOUNT_ID;
+        require("./config");
+      `,
+    ],
+    {
+      cwd: __dirname,
+      encoding: "utf8",
+      env: {
+        ...process.env,
+        CDP_MODE: "live",
+        LIVE_ACCOUNT_ID: "",
+      },
+    }
+  );
+
+  assert.notEqual(result.status, 0);
+  assert.match(
+    (result.stderr || "") + (result.stdout || ""),
+    /CDP_MODE=live requires LIVE_ACCOUNT_ID/
+  );
+});
