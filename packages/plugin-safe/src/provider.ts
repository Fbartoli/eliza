import type { Provider, IAgentRuntime } from "@elizaos/core";
import { createSafeClient, type SafeClient } from '@safe-global/sdk-starter-kit'
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from "node:fs";

const WALLET_DATA_FILE = "wallet_data.txt";

export async function getClient(): Promise<SafeClient> {
    // Validate required environment variables first
    const walletKey = process.env.WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!walletKey) {
        throw new Error("Missing required wallet private key. Please set WALLET_PRIVATE_KEY environment variable.");
    }

    if (!rpcUrl) {
        throw new Error("Missing required RPC URL. Please set RPC_URL environment variable.");
    }

    let _walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
        try {
            _walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
        } catch (error) {
            console.error("Error reading wallet data:", error);
            // Continue without wallet data
        }
    }
    const config = _walletDataStr ? {
        provider: rpcUrl,
        signer: walletKey,
        safeAddress: _walletDataStr,
    } : {
        provider: rpcUrl,
        signer: walletKey,
        owners: [privateKeyToAccount(walletKey as `0x${string}`).address],
        threshold: 1,
        saltNonce: "0"
    }

    try {
        const safeClient = await createSafeClient(config)
        // Save wallet data
        const exportedWallet = await safeClient.getAddress();
        fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);
        return safeClient;
    } catch (error) {
        console.error("Failed to initialize Safe client:", error);
        throw new Error(`Failed to initialize Safe client: ${error.message || 'Unknown error'}`);
    }
}

export const walletProvider: Provider = {
    async get(_runtime: IAgentRuntime): Promise<string | null> {
        try {
            const client = await getClient();
            const address = await client.getAddress();
            return `AgentKit Wallet Address: ${address}`;
        } catch (error) {
            console.error("Error in AgentKit provider:", error);
            return `Error initializing AgentKit wallet: ${error.message}`;
        }
    },
};
