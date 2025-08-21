import { Connection, VersionedTransaction, AddressLookupTableAccount, TransactionMessage } from "@solana/web3.js";

import { usePrivy } from "@privy-io/react-auth";

import { useSolanaWallets } from "@privy-io/react-auth/solana";

import { useChain } from "@/app/_contexts/chain-context";

export const useSendTransaction = () => {

    const { user } = usePrivy();

    const { wallets } = useSolanaWallets();

    const { currentChain } = useChain();

    // For Solana chain, use the first available Solana wallet
    // For other chains, this hook shouldn't be used (they have their own hooks)
    const wallet = currentChain === 'solana' ? wallets[0] : null;

    const sendTransaction = async (transaction: VersionedTransaction) => {
        if(!wallet) throw new Error("No Solana wallet found");

        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

        return wallet.sendTransaction(transaction, connection, {
            skipPreflight: true,
        });
    }

    return {
        sendTransaction,
        wallet
    }
}