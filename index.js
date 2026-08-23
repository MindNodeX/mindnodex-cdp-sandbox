 "use strict";
 
 const { execFileSync } = require("node:child_process");
+const config = require("./config");
 
-const ACCOUNT_ID =
-  process.env.ACCOUNT_ID ||
-  "account_2fccb8de-2e2f-4742-92f7-547451794f9a";
-
 const ASSETS = ["usd", "usdc"];
 
 function getBalance(asset) {
   try {
     const output = execFileSync(
       "cdp",
       [
         "api",
-        `/accounts/${ACCOUNT_ID}/balances/${asset}`,
+        `/accounts/${config.accountId}/balances/${asset}`,
         "-e",
-        "sandbox",
+        config.balanceEnv,
       ],
@@
     return {
       Asset: symbol,
       Available: balance.available || "0",
       Total: balance.total || "0",
     };
@@
 }
 
-console.log("\nMindNodeX CDP Sandbox Dashboard");
-console.log(`Account: ${ACCOUNT_ID}\n`);
+console.log(
+  `\nMindNodeX CDP ${config.modeLabel} Dashboard`
+);
+console.log(`Account: ${config.accountId}\n`);
 console.table(ASSETS.map(getBalance));
-console.log("SANDBOX ONLY — no real funds are connected.\n");
+if (config.isLive) {
+  console.log("LIVE MODE — real account settings are active.\n");
+} else {
+  console.log("SANDBOX ONLY — no real funds are connected.\n");
+}
