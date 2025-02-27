import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Connection, PublicKey } from "@solana/web3.js";

export const raydiumApiClient = Raydium.load({
    connection: new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
})

export const raydiumTransactionClient = async (address: string) => Raydium.load({
    connection: new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
    }),
    owner: new PublicKey(address),
    disableFeatureCheck: true,
    blockhashCommitment: 'confirmed',
})