"use client";

import { useConnectWallet, usePrivy, useLogin as usePrivyLogin, Wallet } from "@privy-io/react-auth";

import { useFundWallet, useSolanaWallets } from "@privy-io/react-auth/solana";

export const useLogin = ({
    onComplete
}: {
    onComplete?: (wallet: Wallet) => void
} = {}) => {
    const { user, ready, logout, linkWallet } = usePrivy();

    const { wallets } = useSolanaWallets();

    const { login } = usePrivyLogin({
        onComplete: async (user, _, __) => {
            if (user.wallet) {
                onComplete?.(user.wallet);
            }
        }
    });

    const { connectWallet } = useConnectWallet();

    const { fundWallet } = useFundWallet();

    return {
        user,
        ready,
        login,
        connectWallet,
        logout,
        wallets,
        fundWallet,
        linkWallet
    }
}