import { CdpClient } from "@coinbase/cdp-sdk";

async function main() {
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  });

  const accounts = await cdp.evm.listAccounts();
  console.log("Node SDK accounts:", accounts);
}

main().catch((err) => {
  console.error("NODE ERROR:", err);
  process.exit(1);
});
