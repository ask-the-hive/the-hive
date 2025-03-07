"use client";

import { useConnectWallet, usePrivy, useLogin as usePrivyLogin, Wallet } from "@privy-io/react-auth";
import { useFundWallet, useSolanaWallets } from "@privy-io/react-auth/solana";
import { useChain } from "@/app/_contexts/chain-context";
import { useEffect, useRef } from "react";

export const useLogin = ({
    onComplete
}: {
    onComplete?: (wallet: Wallet) => void
} = {}) => {
    const { user, ready, logout, linkWallet: privyLinkWallet } = usePrivy();
    const { walletAddresses, setWalletAddress, currentChain, setCurrentChain } = useChain();

    const { wallets: solanaWallets } = useSolanaWallets();
    
    // Use refs to prevent infinite loops
    const processedWallets = useRef<Set<string>>(new Set());
    
    // Filter wallets to get EVM wallets (BSC)
    const evmWallets = user?.linkedAccounts?.filter(account => 
        account.type === 'wallet' && account.walletClientType === 'evm'
    ) || [];

    const wallets = [...solanaWallets];

    // Monitor for changes in linked wallets - only process each wallet once
    useEffect(() => {
        if (solanaWallets.length > 0) {
            solanaWallets.forEach(wallet => {
                if (wallet.address) {
                    const key = `solana:${wallet.address}`;
                    if (!processedWallets.current.has(key)) {
                        console.log("Setting Solana wallet from useLogin hook:", wallet.address);
                        processedWallets.current.add(key);
                        setWalletAddress('solana', wallet.address);
                    }
                }
            });
        }
    }, [solanaWallets, setWalletAddress]);

    const { login } = usePrivyLogin({
        onComplete: async (user, _, __) => {
            if (user.wallet) {
                // Determine wallet type and store address
                const isSolanaWallet = !user.wallet.address.startsWith('0x');
                if (isSolanaWallet) {
                    setWalletAddress('solana', user.wallet.address);
                    setCurrentChain('solana');
                } else {
                    setWalletAddress('bsc', user.wallet.address);
                    setCurrentChain('bsc');
                }
                
                onComplete?.(user.wallet);
            }
        }
    });

    // Enhanced linkWallet that handles wallet type
    const enhancedLinkWallet = () => {
        // Use the appropriate wallet type based on current chain
        if (currentChain === 'solana') {
            console.log("Linking Solana wallet");
            // @ts-ignore - Privy types are not up to date
            privyLinkWallet();
        } else {
            console.log("Linking EVM wallet");
            // @ts-ignore - Privy types are not up to date
            privyLinkWallet();
        }
    };

    // Function to fund BSC wallet using Binance
    const fundBscWallet = (address: string) => {
        // Open the Binance BNB purchase page with the wallet address
        window.open(`https://www.binance.com/en/how-to-buy/bnb?ref=HDFG54&walletAddress=${address}`, '_blank');
    };

    const { connectWallet } = useConnectWallet();

    const { fundWallet } = useFundWallet();

    return {
        user,
        ready,
        login,
        connectWallet,
        logout,
        wallets,
        solanaWallets,
        evmWallets,
        fundWallet,
        fundBscWallet,
        linkWallet: enhancedLinkWallet
    }
}