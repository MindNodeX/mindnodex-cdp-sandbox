@@
 "use strict";
 
 const http = require("node:http");
 const path = require("node:path");
 const fs = require("node:fs/promises");
 const { execFile } = require("node:child_process");
 const { promisify } = require("node:util");
+const config = require("./config");
 
 const runFile = promisify(execFile);
 
 const HOST = "127.0.0.1";
 const PORT = Number(process.env.PORT || 3000);
-
-const ACCOUNT_ID =
-  process.env.ACCOUNT_ID ||
-  "account_2fccb8de-2e2f-4742-92f7-547451794f9a";
 
 const ASSETS = ["usd", "usdc"];
 const HTML_FILE = path.join(__dirname, "public", "index.html");
@@
     "cdp",
     [
       "api",
-      `/accounts/${ACCOUNT_ID}/balances/${asset}`,
+      `/accounts/${config.accountId}/balances/${asset}`,
       "-e",
-      "sandbox",
+      config.balanceEnv,
     ],
@@
   const { stdout } = await runFile(
     "cdp",
-    ["api", "/platform/v2/transfers", "-e", "sandbox-root"],
+    ["api", "/platform/v2/transfers", "-e", config.transferListEnv],
     {
@@
       "api",
       "-X",
       "POST",
       "/platform/v2/transfers",
       "-e",
-      "sandbox-transfer",
-      `source.accountId=${ACCOUNT_ID}`,
+      config.transferEnv,
+      `source.accountId=${config.accountId}`,
       "source.asset=usdc",
@@
       "api",
       "-X",
       "POST",
       "/platform/v2/transfers",
       "-e",
-      "sandbox-transfer",
-      `source.accountId=${ACCOUNT_ID}`,
+      config.transferEnv,
+      `source.accountId=${config.accountId}`,
@@
-      if (body.confirmation !== "SANDBOX") {
+      if (body.confirmation !== config.confirmationWord) {
         sendJson(response, 400, {
-          error: "Type SANDBOX to confirm this simulated transfer.",
+          error: `Type ${config.confirmationWord} to confirm this simulated transfer.`,
         });
         return;
       }
@@
       sendJson(response, 200, {
-        environment: "sandbox",
+        environment: config.environmentLabel,
         simulated: true,
         quote,
@@
       sendJson(response, 201, {
-        environment: "sandbox",
+        environment: config.environmentLabel,
         simulated: true,
         transfer,
@@
       const transfers = (await getTransfers()).filter(
         (transfer) =>
-          transfer.source?.accountId === ACCOUNT_ID ||
-          transfer.target?.accountId === ACCOUNT_ID
+          transfer.source?.accountId === config.accountId ||
+          transfer.target?.accountId === config.accountId
       );
 
       sendJson(response, 200, {
-        accountId: ACCOUNT_ID,
-        environment: "sandbox",
+        accountId: config.accountId,
+        environment: config.environmentLabel,
         updatedAt: new Date().toISOString(),
         transfers,
@@
       const balances = await Promise.all(ASSETS.map(getBalance));
 
       sendJson(response, 200, {
-        accountId: ACCOUNT_ID,
-        environment: "sandbox",
+        accountId: config.accountId,
+        environment: config.environmentLabel,
         updatedAt: new Date().toISOString(),
         balances,
@@
 server.listen(PORT, HOST, () => {
   console.log("\nMindNodeX CDP Sandbox Web Dashboard");
   console.log(`Open: http://${HOST}:${PORT}`);
-  console.log("SANDBOX ONLY — no real funds are connected.\n");
+  if (config.isLive) {
+    console.log("⚠️ LIVE MODE — real account settings are active.\n");
+  } else {
+    console.log("SANDBOX ONLY — no real funds are connected.\n");
+  }
 });
