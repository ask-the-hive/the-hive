import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useChain } from '@/app/_contexts/chain-context';
import { useChat } from '@/app/(app)/chat/_contexts/chat';

import LoginButton from '@/app/(app)/_components/log-in-button';
import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { GetWalletAddressResultType } from '@/ai/base/actions/wallet/get-wallet-address/types';
import type { Wallet } from '@privy-io/react-auth';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const GetWalletAddress: React.FC<Props> = ({ tool, prevToolAgent }) => {
    console.log("BASE GetWalletAddress component rendered", { tool, prevToolAgent });

    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting BASE Wallet Address...`}   
            result={{
                heading: (result: GetWalletAddressResultType) => result.body 
                    ? `Fetched BASE Wallet Address`
                    : "No BASE wallet address found",
                body: (result: GetWalletAddressResultType) => result.body 
                    ? `${result.body.address}` 
                    :  "No BASE wallet address found"
            }}
            call={{
                heading: "Connect BASE Wallet",
                body: (toolCallId: string) => <GetWalletAddressAction toolCallId={toolCallId} />
            }}
            prevToolAgent={prevToolAgent}
        />
    )
}

const GetWalletAddressAction = ({ toolCallId }: { toolCallId: string }) => {
    console.log("BASE GetWalletAddressAction component mounted", { toolCallId });
    
    const { setCurrentChain } = useChain();
    const { user } = usePrivy();
    const { ready: walletsReady, wallets } = useWallets();
    const { addToolResult, isLoading } = useChat();

    // Set the current chain to BASE
    useEffect(() => {
        console.log("Setting current chain to BASE");
        setCurrentChain('base');
    }, [setCurrentChain]);

    // Check for BASE wallets
    useEffect(() => {
        if (!isLoading && walletsReady) {
            console.log("Checking for BASE wallet", {
                userWallet: user?.wallet?.address,
                wallets: wallets.map(w => ({ address: w.address, type: w.walletClientType }))
            });
            
            // First try to find a BASE wallet from useWallets
            const evmWallets = wallets.filter(wallet => wallet.address.startsWith('0x'));
            if (evmWallets.length > 0) {
                const baseWallet = evmWallets[0]; // Use the first EVM wallet
                console.log("Found BASE wallet from useWallets:", baseWallet.address);
                addToolResult(toolCallId, {
                    message: "BASE Wallet connected",
                    body: {
                        address: baseWallet.address
                    }
                });
                return;
            }
            
            // Fallback to user's main wallet if it's an EVM wallet
            if (user?.wallet?.address && user.wallet.address.startsWith('0x')) {
                console.log("Using main wallet address for BASE:", user.wallet.address);
                addToolResult(toolCallId, {
                    message: "BASE Wallet connected",
                    body: {
                        address: user.wallet.address
                    }
                });
                return;
            }
        }
    }, [user, wallets, walletsReady, addToolResult, toolCallId, isLoading]);

    const onComplete = (wallet: Wallet) => {
        console.log("Wallet connection completed:", wallet);
        // Only use the wallet if it's an EVM wallet (BASE)
        if (wallet.address.startsWith('0x')) {
            addToolResult(toolCallId, {
                message: "BASE Wallet connected",
                body: {
                    address: wallet.address
                }
            });
        } else {
            // If it's not a BASE wallet, show an error
            addToolResult(toolCallId, {
                message: "Please connect a BASE wallet (address starting with 0x)",
                body: {
                    address: ""
                }
            });
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <LoginButton onComplete={onComplete} />
        </div>
    )
}

export default GetWalletAddress; 