'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { useChain } from "@/app/_contexts/chain-context";
import { useChat } from "@/app/(app)/chat/_contexts/chat";
import { useTokenMetadata } from "@/hooks/queries/token/use-token-metadata";
import type { Token } from "@/db/types/token";
import type { ToolInvocation } from "ai";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { ETH_METADATA, WETH_ADDRESS, WETH_METADATA } from "@/lib/config/base";
import { ERC20_ABI } from "@/lib/config/abis/erc20";
import ToolCard from "../../tool-card";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import LogInButton from "@/app/(app)/_components/log-in-button";
import { Skeleton } from "@/components/ui/skeleton";
import TokenInput from "./token-input";

interface TransferArgs {
    to: string;
    amount: number;
    tokenAddress?: string;
    tokenSymbol?: string;
    walletAddress: string;
}

interface TransferResult {
    success: boolean;
    txHash?: string;
    amount?: string;
    symbol?: string;
    to?: string;
    error?: string;
}

type BaseToken = Token;

interface TransferCallProps {
    args: TransferArgs;
    toolCallId: string;
}

interface Props {
    tool: ToolInvocation;
    prevToolAgent?: string;
}

const TransferCall: React.FC<TransferCallProps> = ({ args, toolCallId }) => {
    const { addToolResult } = useChat();
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { setCurrentChain, currentChain } = useChain();
    const [isTransferring, setIsTransferring] = useState(false);
    const [amount, setAmount] = useState<string>(args.amount.toString());
    const [toAddress, setToAddress] = useState<string>(args.to);
    
    // Set the current chain to BASE
    useEffect(() => {
        console.log("Setting current chain to BASE");
        setCurrentChain('base');
    }, [setCurrentChain]);
    
    console.log("Current chain in TransferCall:", currentChain);
    
    // Get the BASE wallet from args.walletAddress
    const baseWallet = wallets.find(w => w.address === args.walletAddress) || 
                     (user?.wallet?.address === args.walletAddress ? user.wallet : null);
    
    console.log("BASE wallet:", baseWallet?.address);

    // Default to ETH or WETH based on address
    const [token, setToken] = useState<BaseToken | null>(() => {
        if (!args.tokenAddress || args.tokenAddress === "ETH") {
            return ETH_METADATA;
        }
        if (args.tokenAddress.toLowerCase() === WETH_ADDRESS) {
            return WETH_METADATA;
        }
        return null; // Will be set once we get token data
    });
    
    // Only fetch token metadata if we have a token address
    const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useTokenMetadata(
        args.tokenAddress && args.tokenAddress !== "ETH" ? args.tokenAddress : ""
    );
    
    // Add console logs to debug token metadata
    useEffect(() => {
        console.log("Token metadata request params:", {
            tokenAddress: args.tokenAddress,
            tokenSymbol: args.tokenSymbol,
            isLoading: tokenLoading,
            error: tokenError
        });
        
        if (tokenError) {
            console.error("Token metadata fetch error:", tokenError);
        }
        
        if (tokenData) {
            console.log("Token metadata response:", tokenData);
        }
    }, [args.tokenAddress, args.tokenSymbol, tokenData, tokenLoading, tokenError]);
    
    useEffect(() => {
        if (tokenData && args.tokenAddress && args.tokenAddress !== "ETH") {
            console.log("Setting token data from API:", tokenData);
            // Special handling for WETH
            if (args.tokenAddress.toLowerCase() === WETH_ADDRESS || 
                tokenData.symbol?.toUpperCase() === "WETH") {
                setToken(WETH_METADATA);
                return;
            }
            setToken({
                id: args.tokenAddress,
                name: tokenData.name || "Unknown Token",
                symbol: tokenData.symbol || args.tokenSymbol || "UNKNOWN",
                logoURI: tokenData.logo_uri || "",
                decimals: tokenData.decimals || 18,
                tags: [],
                freezeAuthority: null,
                mintAuthority: null,
                permanentDelegate: null,
                extensions: {}
            });
        } else if (!tokenData && args.tokenSymbol && !args.tokenAddress) {
            console.log("Setting token data from symbol:", args.tokenSymbol);
            // Check if it's ETH/WETH by symbol
            if (args.tokenSymbol.toUpperCase() === "ETH") {
                setToken(ETH_METADATA);
            } else if (args.tokenSymbol.toUpperCase() === "WETH") {
                setToken(WETH_METADATA);
            } else {
                setToken({
                    id: "ETH",
                    name: args.tokenSymbol,
                    symbol: args.tokenSymbol,
                    logoURI: "",
                    decimals: 18,
                    tags: [],
                    freezeAuthority: null,
                    mintAuthority: null,
                    permanentDelegate: null,
                    extensions: {}
                });
            }
        } else if (!tokenData && args.tokenAddress && args.tokenAddress !== "ETH") {
            console.log("No token data received, using fallback data for address:", args.tokenAddress);
            // Check if it's WETH by address
            if (args.tokenAddress.toLowerCase() === WETH_ADDRESS) {
                setToken(WETH_METADATA);
                return;
            }
            // Fallback for when token metadata fails
            setToken({
                id: args.tokenAddress,
                name: args.tokenSymbol || "Unknown Token",
                symbol: args.tokenSymbol || "UNKNOWN",
                logoURI: "",
                decimals: 18,
                tags: [],
                freezeAuthority: null,
                mintAuthority: null,
                permanentDelegate: null,
                extensions: {}
            });
        } else if (args.tokenAddress === "ETH" || (!args.tokenAddress && args.tokenSymbol === "ETH")) {
            console.log("Setting ETH token data");
            setToken(ETH_METADATA);
        }
    }, [tokenData, args.tokenAddress, args.tokenSymbol]);

    const onTransfer = async () => {
        if (!baseWallet) {
            console.error("No BASE wallet found");
            addToolResult<TransferResult>(toolCallId, {
                message: "No BASE wallet found",
                body: {
                    success: false,
                    error: "No BASE wallet found"
                }
            });
            return;
        }

        if (!token) {
            console.error("No token selected");
            addToolResult<TransferResult>(toolCallId, {
                message: "No token selected",
                body: {
                    success: false,
                    error: "No token selected"
                }
            });
            return;
        }

        setIsTransferring(true);

        try {
            const signer = await (baseWallet as any).getEthersJsSigner();
            let tx;
            let symbol;

            if (!token || token.symbol === "ETH") {
                // Transfer ETH
                console.log(`Transferring ${amount} ETH to ${toAddress}`);
                tx = await signer.sendTransaction({
                    to: toAddress,
                    value: ethers.parseEther(amount)
                });
                symbol = "ETH";
            } else {
                // Transfer token
                console.log(`Transferring ${amount} ${token.symbol} (${token.id}) to ${toAddress}`);
                const contract = new ethers.Contract(token.id, ERC20_ABI, signer);
                
                try {
                    const decimals = await contract.decimals();
                    console.log(`Token decimals: ${decimals}`);
                    const tokenSymbol = await contract.symbol();
                    console.log(`Token symbol from contract: ${tokenSymbol}`);
                    const tokenAmount = ethers.parseUnits(amount, decimals);
                    console.log(`Parsed token amount: ${tokenAmount.toString()}`);
                    
                    tx = await contract.transfer(toAddress, tokenAmount);
                    symbol = tokenSymbol;
                } catch (error) {
                    console.error("Error interacting with token contract:", error);
                    throw new Error(`Failed to interact with token contract: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            console.log("Transaction sent:", tx.hash);
            
            addToolResult<TransferResult>(toolCallId, {
                message: `Successfully transferred ${amount} ${symbol} to ${toAddress}`,
                body: {
                    success: true,
                    txHash: tx.hash,
                    amount,
                    symbol,
                    to: toAddress
                }
            });
        } catch (error) {
            console.error("Transfer error:", error);
            addToolResult<TransferResult>(toolCallId, {
                message: `Transfer failed: ${error instanceof Error ? error.message : String(error)}`,
                body: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        } finally {
            setIsTransferring(false);
        }
    };

    // Define priority tokens for BASE
    const priorityTokens = [
        WETH_ADDRESS, // WETH
        '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDC
    ];

    if (tokenLoading) {
        return <Skeleton className="h-48 w-96" />;
    }

    return (
        <Card className="flex flex-col gap-2 p-2">
            <div className="flex flex-col items-center gap-2">
                <TokenInput
                    token={token}
                    label="Transfer"
                    amount={amount}
                    onChange={(newAmount) => {
                        setAmount(newAmount);
                    }}
                    onChangeToken={(newToken) => {
                        setToken(newToken);
                    }}
                    priorityTokens={priorityTokens}
                />
                <ChevronDown className="w-4 h-4" />
                <Input
                    value={toAddress}
                    onChange={(e) => {
                        setToAddress(e.target.value);
                    }}
                    placeholder="To address"
                />
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
                {
                    baseWallet ? (
                        <Button
                            variant="brand"
                            onClick={onTransfer}
                            disabled={isTransferring || !token || !amount || Number(amount) <= 0 || !toAddress}
                        >
                            {isTransferring ? "Transferring..." : "Transfer"}
                        </Button>
                    ) : (
                        <LogInButton />
                    )
                }
                <Button
                    variant="outline"
                    onClick={() => {
                        addToolResult<TransferResult>(toolCallId, {
                            message: "Transfer cancelled",
                            body: {
                                success: false,
                                error: "Transfer cancelled by user"
                            }
                        });
                    }}
                    disabled={isTransferring}
                >
                    Cancel
                </Button>
            </div>
        </Card>
    );
};

const Transfer: React.FC<Props> = ({ tool, prevToolAgent }) => {
    console.log("BASE Transfer component rendered", { tool, prevToolAgent });

    return (
        <ToolCard<TransferResult, TransferArgs> 
            tool={tool}
            loadingText={`Preparing transfer...`}   
            result={{
                heading: (result) => {
                    console.log("Transfer result:", result);
                    return result.body?.success 
                        ? `Transfer successful`
                        : result.body?.error 
                            ? "Transfer failed" 
                            : "Confirm Transfer";
                },
                body: (result) => {
                    console.log("Transfer result body:", result.body);
                    if (result.body?.success) {
                        return `Successfully transferred ${result.body.amount} ${result.body.symbol} to ${result.body.to}`;
                    }
                    if (result.body?.error) {
                        return result.body.error;
                    }
                    // If no success or error, show the transfer UI
                    return <TransferCall toolCallId={tool.toolCallId} args={{
                        to: tool.args.to,
                        amount: tool.args.amount,
                        tokenAddress: tool.args.tokenAddress,
                        tokenSymbol: tool.args.tokenSymbol,
                        walletAddress: tool.args.walletAddress
                    }} />;
                }
            }}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default Transfer; 