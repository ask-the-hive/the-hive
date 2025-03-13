'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card, Button, Input, Separator, Skeleton } from '@/components/ui'
import ToolCard from '../../tool-card'
import { useChat } from '@/app/(app)/chat/_contexts/chat'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import LogInButton from '@/app/(app)/_components/log-in-button'
import { useTokenMetadata } from '@/hooks/queries/token'
import TokenInput from '../../utils/swap/token-input'
import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useChain } from '@/app/_contexts/chain-context'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import TokenDisplay from '@/app/_components/token-display'

import type { ToolInvocation } from 'ai'
import type { BscActionResult } from '@/ai/bsc/actions/bsc-action'
import type { TransferResultBodyType, TransferArgumentsType } from '@/ai/bsc/actions/wallet/transfer/types'
import type { Token } from '@/db/types'

// Define a BSC token type that matches our needs
interface BscToken {
    id: string;
    name: string;
    symbol: string;
    logoURI: string;
    decimals: number;
    tags: string[];
    extensions: Record<string, unknown>;
}

// ERC20 Token ABI for transfer function
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

type TransferResultType = BscActionResult<TransferResultBodyType>

// Constants for BNB/WBNB
const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const BNB_METADATA = {
    id: "BNB",
    name: "Binance Coin",
    symbol: "BNB",
    logoURI: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    decimals: 18,
    tags: [],
    extensions: {}
};

const WBNB_METADATA = {
    ...BNB_METADATA,
    id: WBNB_ADDRESS,
    name: "Wrapped BNB",
    symbol: "WBNB"
};

// Custom hook for BSC token search
const useBscTokenSearch = (input: string) => {
    const [results, setResults] = useState<BscToken[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTokens = async () => {
            if (!input) {
                setResults([]);
                return;
            }
            
            setLoading(true);
            try {
                // First, search for tokens
                const response = await fetch("/api/token/search", {
                    method: "POST",
                    body: JSON.stringify({ search: input, chain: 'bsc' }),
                });
                const data = await response.json();
                
                if (!data[0]?.result?.length) {
                    setResults([]);
                    setLoading(false);
                    return;
                }

                // For each token, fetch its metadata to get the proper icon
                const tokenPromises = data[0].result.map(async (item: any) => {
                    try {
                        const metadataResponse = await fetch(`/api/token/${item.address}/metadata?chain=bsc`);
                        const metadata = await metadataResponse.json();
                        
                        return {
                            id: item.address,
                            symbol: metadata.symbol || item.symbol,
                            name: metadata.name || item.name,
                            decimals: metadata.decimals || item.decimals,
                            logoURI: metadata.logo_uri || 'https://www.birdeye.so/images/unknown-token-icon.svg',
                            tags: [],
                            extensions: metadata.extensions || {}
                        };
                    } catch (error) {
                        console.error(`Error fetching metadata for token ${item.address}:`, error);
                        return {
                            id: item.address,
                            symbol: item.symbol,
                            name: item.name,
                            decimals: item.decimals,
                            logoURI: 'https://www.birdeye.so/images/unknown-token-icon.svg',
                            tags: [],
                            extensions: {}
                        };
                    }
                });
                
                const tokens = await Promise.all(tokenPromises);
                console.log("Fetched token metadata:", tokens);
                setResults(tokens);
            } catch (error) {
                console.error('BSC token search error:', error);
                setResults([]);
            }
            setLoading(false);
        };

        const debounceTimer = setTimeout(fetchTokens, 300);
        return () => clearTimeout(debounceTimer);
    }, [input]);

    return { results, loading };
};

// Custom BSC Token Select component
const BscTokenSelect: React.FC<{
    value: BscToken | null,
    onChange: (token: BscToken | null) => void
}> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const { results, loading } = useBscTokenSearch(input);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className="w-fit shrink-0 flex items-center bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md px-2 py-1 gap-2 cursor-pointer transition-colors duration-200"
                >
                    {
                        value ? (
                            <img 
                                src={value.logoURI || 'https://www.birdeye.so/images/unknown-token-icon.svg'} 
                                alt={value.name} 
                                className="w-6 h-6 rounded-full" 
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-600" />
                        )
                    }
                    <p className={cn(
                        "text-xs font-bold",
                        value ? "opacity-100" : "opacity-50"
                    )}>
                        {value ? value.symbol : "Select"}
                    </p>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 flex flex-col gap-2">
                <Input
                    placeholder="Search BSC tokens..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                {
                    loading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-scroll">
                            {
                                input ? (
                                    results.length === 0 ? (
                                        <p className="text-xs text-neutral-500">
                                            No results for &quot;{input}&quot;
                                        </p>
                                    ) : (
                                        results.map((token) => (
                                            <Button 
                                                key={token.id}
                                                variant="ghost"
                                                className="w-full justify-start px-1"
                                                onClick={() => {
                                                    setOpen(false);
                                                    onChange(token as BscToken);
                                                }}
                                            >
                                                <img 
                                                    src={token.logoURI || "https://www.birdeye.so/images/unknown-token-icon.svg"} 
                                                    alt={token.name} 
                                                    className="w-6 h-6 rounded-full" 
                                                />
                                                <p className="text-sm font-bold">
                                                    {token.symbol}
                                                </p>
                                            </Button>
                                        ))
                                    )
                                ) : (
                                    <p className="text-xs text-neutral-500">
                                        Type to search for BSC tokens
                                    </p>
                                )
                            }
                        </div>
                    )
                }
            </PopoverContent>
        </Popover>
    );
};

// Custom BSC Token Input component
const BscTokenInput: React.FC<{
    token: BscToken | null,
    label: string,
    amount: string,
    onChange?: (amount: string) => void,
    onChangeToken?: (token: BscToken | null) => void,
    address?: string
}> = ({ token, label, amount, onChange, onChangeToken, address }) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // Get token price for display
    const tokenPrice = 0; // Default price

    return (
        <div className={cn(
            "flex flex-col border border-transparent rounded-md p-2 w-full transition-colors bg-neutral-100 dark:bg-neutral-700 gap-2",
            isFocused && "border-brand-600"
        )}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                    {label}
                </p>
            </div>
            <div className={cn(
                "flex items-center w-full",
            )}>
                <div className="w-full">
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => onChange && onChange(e.target.value)} 
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={!onChange}
                        placeholder="0.00"
                    />
                    {
                        token && (
                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                                ${(tokenPrice * Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        )
                    }
                </div>
                {
                    onChangeToken ? (
                        <BscTokenSelect
                            value={token}
                            onChange={onChangeToken}
                        />
                    ) : (
                        token && (
                            <TokenDisplay token={token as unknown as Token} />
                        )
                    )
                }
            </div>
        </div>
    );
};

interface TransferCallProps {
    args: {
        to: string;
        amount: number;
        tokenAddress?: string;
        tokenSymbol?: string;
    };
    toolCallId: string;
}

const TransferCall: React.FC<TransferCallProps> = ({ args, toolCallId }) => {
    const { addToolResult } = useChat();
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { setCurrentChain, currentChain } = useChain();
    const [isTransferring, setIsTransferring] = useState(false);
    const [amount, setAmount] = useState<string>(args.amount.toString());
    const [toAddress, setToAddress] = useState<string>(args.to);
    
    // Set the current chain to BSC
    useEffect(() => {
        console.log("Setting current chain to BSC");
        setCurrentChain('bsc');
    }, [setCurrentChain]);
    
    console.log("Current chain in TransferCall:", currentChain);
    
    // Get the BSC wallet
    const bscWallet = wallets.find(w => w.address.startsWith('0x')) || user?.wallet;
    
    console.log("BSC wallet:", bscWallet?.address);

    // Default to BNB or WBNB based on address
    const [token, setToken] = useState<BscToken | null>(() => {
        if (!args.tokenAddress || args.tokenAddress === "BNB") {
            return BNB_METADATA;
        }
        if (args.tokenAddress.toLowerCase() === WBNB_ADDRESS) {
            return WBNB_METADATA;
        }
        return null; // Will be set once we get token data
    });
    
    console.log("Initial token state:", token);
    console.log("Transfer args:", args);
    
    // Only fetch token metadata if we have a token address
    const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useTokenMetadata(
        args.tokenAddress && args.tokenAddress !== "BNB" ? args.tokenAddress : ""
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
        if (tokenData && args.tokenAddress && args.tokenAddress !== "BNB") {
            console.log("Setting token data from API:", tokenData);
            // Special handling for WBNB
            if (args.tokenAddress.toLowerCase() === WBNB_ADDRESS || 
                tokenData.symbol?.toUpperCase() === "WBNB") {
                setToken(WBNB_METADATA);
                return;
            }
            setToken({
                id: args.tokenAddress,
                name: tokenData.name || "Unknown Token",
                symbol: tokenData.symbol || args.tokenSymbol || "UNKNOWN",
                logoURI: tokenData.logo_uri || "",
                decimals: tokenData.decimals || 18,
                tags: [],
                extensions: {}
            });
        } else if (args.tokenSymbol && !args.tokenAddress) {
            // If we have a symbol but no address, use the symbol
            console.log("Setting token data from symbol:", args.tokenSymbol);
            // Check if it's BNB/WBNB by symbol
            if (args.tokenSymbol.toUpperCase() === "BNB") {
                setToken(BNB_METADATA);
            } else if (args.tokenSymbol.toUpperCase() === "WBNB") {
                setToken(WBNB_METADATA);
            } else {
                setToken({
                    id: "BNB",
                    name: args.tokenSymbol,
                    symbol: args.tokenSymbol,
                    logoURI: "",
                    decimals: 18,
                    tags: [],
                    extensions: {}
                });
            }
        } else if (!tokenData && args.tokenAddress && args.tokenAddress !== "BNB") {
            console.log("No token data received, using fallback data for address:", args.tokenAddress);
            // Check if it's WBNB by address
            if (args.tokenAddress.toLowerCase() === WBNB_ADDRESS) {
                setToken(WBNB_METADATA);
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
                extensions: {}
            });
        } else if (args.tokenAddress === "BNB" || (!args.tokenAddress && args.tokenSymbol === "BNB")) {
            console.log("Setting BNB token data");
            setToken(BNB_METADATA);
        }
    }, [tokenData, args.tokenAddress, args.tokenSymbol]);

    const onTransfer = async () => {
        if (!bscWallet || !toAddress || !amount) {
            console.error("Missing required transfer parameters:", { wallet: !!bscWallet, toAddress, amount });
            return;
        }

        setIsTransferring(true);
        try {
            console.log("Starting transfer with parameters:", {
                token: token?.symbol,
                tokenAddress: token?.id,
                amount,
                toAddress
            });
            
            const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
            console.log("Using BSC RPC URL:", process.env.NEXT_PUBLIC_BSC_RPC_URL);
            
            // @ts-ignore - Privy wallet does have this method
            const signer = await bscWallet.getEthersJsSigner();
            console.log("Got signer from wallet");

            let tx;
            let symbol;

            if (!token || token.symbol === "BNB") {
                // Transfer BNB
                console.log(`Transferring ${amount} BNB to ${toAddress}`);
                tx = await signer.sendTransaction({
                    to: toAddress,
                    value: ethers.parseEther(amount)
                });
                symbol = "BNB";
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

            console.log("Transaction submitted:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed");

            addToolResult(toolCallId, {
                message: `Successfully transferred ${amount} ${symbol} to ${toAddress}`,
                body: {
                    amount: parseFloat(amount),
                    recipient: toAddress,
                    token: symbol,
                    transaction: tx.hash
                }
            });
        } catch (e) {
            console.error('Transfer error:', e);
            addToolResult(toolCallId, {
                message: `Failed to transfer: ${e instanceof Error ? e.message : "Unknown error"}`,
                body: {
                    error: e instanceof Error ? e.message : "Unknown error"
                }
            });
        } finally {
            setIsTransferring(false);
        }
    };

    const onCancel = () => {
        addToolResult(toolCallId, {
            message: "Transfer cancelled",
            body: {
                cancelled: true
            }
        });
    };

    if (tokenLoading && args.tokenAddress && args.tokenAddress !== "BNB") {
        return (
            <Card className="flex flex-col gap-2 p-2">
                <Skeleton className="h-48 w-full" />
                <p className="text-sm text-center">Loading token data...</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-2 p-2">
            <div className="flex flex-col items-center gap-2">
                <BscTokenInput
                    token={token}
                    label="Transfer"
                    amount={amount}
                    onChange={(value) => setAmount(value)}
                    onChangeToken={(selectedToken) => setToken(selectedToken)}
                    address={bscWallet?.address}
                />
                <ChevronDown className="w-4 h-4" />
                <Input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="To address"
                />
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
                {bscWallet ? (
                    <Button
                        variant="brand"
                        onClick={onTransfer}
                        disabled={isTransferring || !amount || Number(amount) <= 0 || !toAddress}
                    >
                        {isTransferring ? "Transferring..." : "Transfer"}
                    </Button>
                ) : (
                    <LogInButton />
                )}
                <Button 
                    variant="outline"
                    onClick={onCancel}
                    disabled={isTransferring}
                >
                    Cancel
                </Button>
            </div>
        </Card>
    );
};

interface TransferProps {
    tool: ToolInvocation
    prevToolAgent?: string
}

const Transfer: React.FC<TransferProps> = ({ tool, prevToolAgent }) => {
    console.log("BSC Transfer component rendered", { tool, prevToolAgent });
    
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Preparing transfer of ${tool.args.amount} ${tool.args.tokenSymbol || "BNB"}...`}
            inputDisabledMessage={
                tool.state === "call" ? "Complete or cancel your transfer to continue" : undefined
            }
            result={{
                heading: (result: TransferResultType) => {
                    if (result.body?.cancelled) return "Transfer Cancelled";
                    if (result.body?.error) return "Transfer Failed";
                    return result.body?.transaction 
                        ? `Transfer Complete` 
                        : "Confirm Transfer";
                },
                body: (result: TransferResultType) => {
                    if (result.body?.cancelled) return "Transfer was cancelled.";
                    if (result.body?.error) return `Error: ${result.body.error}`;
                    if (!result.body?.transaction) {
                        return (
                            <TransferCall 
                                args={{
                                    to: result.body?.recipient || tool.args.to,
                                    amount: result.body?.amount || tool.args.amount,
                                    tokenSymbol: result.body?.token || tool.args.tokenSymbol || "BNB",
                                    tokenAddress: tool.args.tokenAddress
                                }} 
                                toolCallId={tool.toolCallId} 
                            />
                        );
                    }
                    return `Transaction hash: ${result.body.transaction}`;
                }
            }}
            call={{
                heading: "Transfer",
                body: (toolCallId: string, args: TransferArgumentsType) => (
                    <TransferCall 
                        args={{
                            to: args.to,
                            amount: args.amount,
                            tokenSymbol: args.tokenSymbol || "BNB",
                            tokenAddress: args.tokenAddress
                        }} 
                        toolCallId={toolCallId} 
                    />
                )
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default Transfer 