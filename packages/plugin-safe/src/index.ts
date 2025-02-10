import type { Plugin } from "@elizaos/core";
import { walletProvider, getClient } from "./provider";
import { getSafeActions } from "./actions";

// Initial banner
console.log("\n┌════════════════════════════════════════┐");
console.log("│          SAFE PLUGIN                   │");
console.log("├────────────────────────────────────────┤");
console.log("│  Initializing Safe Plugin...           │");
console.log("│  Version: 0.0.1                        │");
console.log("└════════════════════════════════════════┘");

const initializeActions = async () => {
    try {
        // Validate environment variables
        const walletKey = process.env.WALLET_PRIVATE_KEY;

        if (!walletKey) {
            console.warn("⚠️ Missing wallet private key");
            return [];
        }

        const actions = await getSafeActions({
            getClient,
        });
        console.log("✔ Safe actions initialized successfully.");
        return actions;
    } catch (error) {
        console.error("❌ Failed to initialize Safe actions:", error);
        return []; // Return empty array instead of failing
    }
};

export const agentKitPlugin: Plugin = {
    name: "Safe Integration",
    description: "Safe integration plugin",
    providers: [walletProvider],
    evaluators: [],
    services: [],
    actions: await initializeActions(),
};

export default agentKitPlugin;
