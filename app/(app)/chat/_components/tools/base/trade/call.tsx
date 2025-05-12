'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useChain } from '@/app/_contexts/chain-context';
import type { TradeArgumentsType } from '@/ai/base/actions/trade/actions/types';
import TokenInput from '../../bsc/transfer/token-input';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import LogInButton from '@/app/(app)/_components/log-in-button';
import type { Token } from '@/db/types/token';

interface Props {
    toolCallId: string;
    args: TradeArgumentsType;
}

const SwapCallBody: React.FC<Props> = ({ toolCallId, args }) => {
    const { addToolResult } = useChat();
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { setCurrentChain } = useChain();
    const [isSwapping, setIsSwapping] = useState(false);
    const [inputAmount, setInputAmount] = useState<string>(args.inputAmount?.toString() || "");
    const [isLoading, setIsLoading] = useState(true);
    
    // Set the current chain to Base
    useEffect(() => {
        setCurrentChain('base');
    }, [setCurrentChain]);
    
    // Get the Base wallet from args.walletAddress
    const baseWallet = wallets.find(w => w.address === args.walletAddress) || 
                     (user?.wallet?.address === args.walletAddress ? user.wallet : null);

    // Default to ETH for input token
    const [inputToken, setInputToken] = useState<Token | null>(() => {
        if (!args.inputTokenAddress || args.inputTokenAddress === "ETH") {
            return {
                id: "ETH",
                name: "Ethereum",
                symbol: "ETH",
                logoURI: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png",
                decimals: 18,
                tags: [],
                freezeAuthority: null,
                mintAuthority: null,
                permanentDelegate: null,
                extensions: {}
            };
        }
        return null;
    });

    // Default to provided output token
    const [outputToken, setOutputToken] = useState<Token | null>(() => {
        if (!args.outputTokenAddress || args.outputTokenAddress === "ETH") {
            return {
                id: "ETH",
                name: "Ethereum",
                symbol: "ETH",
                logoURI: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png",
                decimals: 18,
                tags: [],
                freezeAuthority: null,
                mintAuthority: null,
                permanentDelegate: null,
                extensions: {}
            };
        }
        return null;
    });
    
    // Search and fetch token metadata
    useEffect(() => {
        const fetchTokens = async () => {
            setIsLoading(true);
            try {
                // Handle input token
                if (args.inputTokenAddress && args.inputTokenAddress !== "ETH") {
                    // Always use uppercase symbol for search
                    const searchQuery = args.inputTokenAddress.toUpperCase();
                    // Search for token using the API endpoint
                    const response = await fetch(`/api/token/search?query=${encodeURIComponent(searchQuery)}&chain=base&search_mode=fuzzy`);
                    const data = await response.json();
                    
                    const token = data.tokens?.[0];
                    if (token) {
                        setInputToken({
                            id: token.address,
                            name: token.name || "Unknown Token",
                            symbol: token.symbol || "UNKNOWN",
                            logoURI: token.logo_uri || "",
                            decimals: 18, // Default to 18 decimals for Base tokens
                            tags: [],
                            freezeAuthority: null,
                            mintAuthority: null,
                            permanentDelegate: null,
                            extensions: {}
                        });
                    }
                }

                // Handle output token
                if (args.outputTokenAddress && args.outputTokenAddress !== "ETH") {
                    // Always use uppercase symbol for search
                    const searchQuery = args.outputTokenAddress.toUpperCase();
                    // Search for token using the API endpoint
                    const response = await fetch(`/api/token/search?query=${encodeURIComponent(searchQuery)}&chain=base&search_mode=fuzzy`);
                    const data = await response.json();
                    
                    const token = data.tokens?.[0];
                    if (token) {
                        setOutputToken({
                            id: token.address,
                            name: token.name || "Unknown Token",
                            symbol: token.symbol || "UNKNOWN",
                            logoURI: token.logo_uri || "",
                            decimals: 18, // Default to 18 decimals for Base tokens
                            tags: [],
                            freezeAuthority: null,
                            mintAuthority: null,
                            permanentDelegate: null,
                            extensions: {}
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching token data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTokens();
    }, [args.inputTokenAddress, args.outputTokenAddress]);

    const onSwap = async () => {
        if (!baseWallet) {
            addToolResult(toolCallId, {
                message: "No Base wallet found",
                body: {
                    transaction: "",
                    inputAmount: 0,
                    inputToken: "",
                    outputToken: "",
                    walletAddress: args.walletAddress,
                    error: "No Base wallet found"
                }
            });
            return;
        }

        if (!inputToken || !outputToken) {
            addToolResult(toolCallId, {
                message: "Please select both input and output tokens",
                body: {
                    transaction: "",
                    inputAmount: 0,
                    inputToken: "",
                    outputToken: "",
                    walletAddress: args.walletAddress,
                    error: "Please select both input and output tokens"
                }
            });
            return;
        }

        setIsSwapping(true);

        try {
            // In a real implementation, this would call the API to execute the trade
            // For now, we'll just simulate a successful trade
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            addToolResult(toolCallId, {
                message: `Successfully swapped ${inputAmount} ${inputToken.symbol} for ${outputToken.symbol}`,
                body: {
                    transaction: "0x1234567890abcdef",
                    inputAmount: Number(inputAmount),
                    inputToken: inputToken.symbol,
                    outputToken: outputToken.symbol,
                    walletAddress: args.walletAddress,
                    success: true
                }
            });
        } catch (error) {
            console.error('Error executing trade:', error);
            addToolResult(toolCallId, {
                message: `Failed to execute trade: ${error}`,
                body: {
                    transaction: "",
                    inputAmount: Number(inputAmount || "0"),
                    inputToken: inputToken?.symbol || "",
                    outputToken: outputToken?.symbol || "",
                    walletAddress: args.walletAddress,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        } finally {
            setIsSwapping(false);
        }
    };

    // Define priority tokens for Base
    const priorityTokens = [
        '0x4200000000000000000000000000000000000006', // WETH
        '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    ];

    if (isLoading) {
        return <Skeleton className="h-48 w-96" />;
    }

    return (
        <Card className="p-2 w-[384px]">
            <div className="flex flex-col items-center gap-2">
                <TokenInput
                    token={inputToken}
                    label="Sell"
                    amount={inputAmount}
                    onChange={(newAmount) => {
                        setInputAmount(newAmount);
                    }}
                    onChangeToken={(newToken) => {
                        setInputToken(newToken);
                    }}
                    priorityTokens={priorityTokens}
                />
                <ChevronDown className="w-4 h-4" />
                <TokenInput
                    token={outputToken}
                    label="Buy"
                    amount={""}
                    onChangeToken={(newToken) => {
                        setOutputToken(newToken);
                    }}
                    priorityTokens={priorityTokens}
                />
            </div>
            <Separator className="my-2" />
            <div className="flex flex-col gap-2">
                {
                    baseWallet ? (
                        <Button
                            variant="brand"
                            onClick={onSwap}
                            disabled={isSwapping || !inputToken || !outputToken || !inputAmount || Number(inputAmount) <= 0}
                            className="w-full"
                        >
                            {isSwapping ? "Swapping..." : "Swap"}
                        </Button>
                    ) : (
                        <div className="w-full">
                            <LogInButton />
                        </div>
                    )
                }
                <Button
                    variant="outline"
                    onClick={() => {
                        addToolResult(toolCallId, {
                            message: "Swap cancelled by user",
                            body: {
                                transaction: "",
                                inputAmount: Number(inputAmount || "0"),
                                inputToken: inputToken?.symbol || "",
                                outputToken: outputToken?.symbol || "",
                                walletAddress: args.walletAddress,
                                success: false,
                                error: "Swap cancelled by user"
                            }
                        });
                    }}
                    disabled={isSwapping}
                    className="w-full"
                >
                    Cancel
                </Button>
            </div>
        </Card>
    );
};

export default SwapCallBody; 