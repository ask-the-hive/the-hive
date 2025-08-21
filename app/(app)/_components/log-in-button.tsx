'use client'

import React, { useEffect } from 'react'
import '@/components/utils/suppress-console'
import { Button } from '@/components/ui'
import { useLogin } from '@/hooks'
import { Wallet, useWallets } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth/solana'
import { useChain } from '@/app/_contexts/chain-context'

interface Props {
    onComplete?: (wallet: Wallet) => void,
}

const LogInButton: React.FC<Props> = ({ onComplete }) => {
    const { login, user, linkWallet } = useLogin({
        onComplete
    })
    const { currentChain, walletAddresses } = useChain();
    const { wallets } = useWallets();
    const { wallets: solanaWallets } = useSolanaWallets();

    // Find the appropriate wallet address based on the current chain
    const getWalletAddress = () => {
        console.log("Getting wallet address for chain:", currentChain);
        
        // First check wallets from the appropriate hook based on chain
        if (currentChain === 'bsc' || currentChain === 'base') {
            // Find EVM wallets
            const evmWallets = wallets.filter(w => w.address.startsWith('0x'));
            console.log("EVM wallets found:", evmWallets.length);
            if (evmWallets.length > 0) {
                return evmWallets[0].address;
            }
        } else {
            // Find Solana wallets
            console.log("Solana wallets found:", solanaWallets.length);
            if (solanaWallets.length > 0) {
                return solanaWallets[0].address;
            }
            
            // Also check for non-EVM wallets in the main wallets array
            const nonEvmWallets = wallets.filter(w => !w.address.startsWith('0x'));
            console.log("Non-EVM wallets found:", nonEvmWallets.length);
            if (nonEvmWallets.length > 0) {
                return nonEvmWallets[0].address;
            }
        }
        
        // Fallback to chain context
        const contextAddress = currentChain === 'solana'
            ? walletAddresses.solana
            : currentChain === 'bsc'
                ? walletAddresses.bsc
                : walletAddresses.base;
            
        console.log("Using address from context:", contextAddress);
        
        // Final fallback to user's main wallet if it matches the current chain
        if (!contextAddress && user?.wallet?.address) {
            const isUserWalletEvm = user.wallet.address.startsWith('0x');
            if ((currentChain === 'bsc' && isUserWalletEvm) || 
                (currentChain === 'base' && isUserWalletEvm) ||
                (currentChain === 'solana' && !isUserWalletEvm)) {
                console.log("Using user's main wallet:", user.wallet.address);
                return user.wallet.address;
            }
        }
        
        return contextAddress;
    };

    const address = getWalletAddress();

    // Debug logging
    useEffect(() => {
        console.log("Login button state:", {
            currentChain,
            walletAddresses,
            userWallet: user?.wallet?.address,
            solanaWallets: solanaWallets.map(w => ({ address: w.address })),
            evmWallets: wallets.filter(w => w.address.startsWith('0x')).map(w => ({ address: w.address })),
            displayAddress: address
        });
    }, [currentChain, walletAddresses, user, address, wallets, solanaWallets]);

    return (
        <Button 
            variant="brand"
            onClick={() => { if(user) { linkWallet() } else { login() } }}
            className="w-full"
        >
            Connect Wallet
        </Button>
    )
}

export default LogInButton