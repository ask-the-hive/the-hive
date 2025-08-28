'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { 
    createWalletClient, 
    custom, 
    publicActions,
    parseUnits,
    formatUnits,
    type Address,
} from 'viem';
import { base } from 'viem/chains';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, type ConnectedWallet } from '@privy-io/react-auth';
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
    const [expectedOutput, setExpectedOutput] = useState<string>("");
    const [balance, setBalance] = useState<string>("");
    const [isGettingQuote, setIsGettingQuote] = useState(false);
    
    // Set the current chain to Base
    useEffect(() => {
        setCurrentChain('base');
    }, [setCurrentChain]);
    
    // Get the Base wallet from args.walletAddress
    const baseWallet = (wallets.find(w => w.address === args.walletAddress) || 
                     (user?.wallet?.address === args.walletAddress ? user.wallet : null)) as ConnectedWallet | null;

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
    
    // Get balance when input token changes
    useEffect(() => {
        const getBalance = async () => {
            if (!baseWallet || !inputToken) return;

            try {
                const client = createWalletClient({
                    account: baseWallet.address as Address,
                    chain: base,
                    transport: custom(await baseWallet.getEthereumProvider())
                }).extend(publicActions);

                let tokenBalance: bigint;
                if (inputToken.symbol === "ETH") {
                    tokenBalance = await client.getBalance({ address: baseWallet.address as Address });
                } else {
                    tokenBalance = await client.readContract({
                        address: inputToken.id as Address,
                        abi: [{
                            name: 'balanceOf',
                            type: 'function',
                            stateMutability: 'view',
                            inputs: [{ name: 'account', type: 'address' }],
                            outputs: [{ name: '', type: 'uint256' }]
                        }],
                        functionName: 'balanceOf',
                        args: [baseWallet.address as Address]
                    });
                }

                setBalance(formatUnits(tokenBalance, inputToken.decimals));
            } catch (error) {
                console.error('Error getting balance:', error);
            }
        };

        getBalance();
    }, [baseWallet, inputToken]);

    // Get quote when amount changes
    useEffect(() => {
        const getQuote = async () => {
            if (!baseWallet || !inputToken || !outputToken || !inputAmount || Number(inputAmount) <= 0) {
                setExpectedOutput("");
                return;
            }

            setIsGettingQuote(true);
            try {
                const sellAmountRaw = parseUnits(inputAmount, inputToken.decimals);
                const sellToken = inputToken.symbol === "ETH" ? "ETH" : inputToken.id;
                const buyToken = outputToken.symbol === "ETH" ? "ETH" : outputToken.id;

                const quoteResponse = await fetch(
                    `/api/swap/base/quote?` + new URLSearchParams({
                        sellToken: sellToken,
                        buyToken: buyToken,
                        sellAmount: sellAmountRaw.toString(),
                        taker: baseWallet.address
                    }).toString()
                );

                if (quoteResponse.ok) {
                    const quote = await quoteResponse.json();
                    setExpectedOutput(formatUnits(BigInt(quote.buyAmount), outputToken.decimals));
                }
            } catch (error) {
                console.error('Error getting quote:', error);
                setExpectedOutput("");
            } finally {
                setIsGettingQuote(false);
            }
        };

        getQuote();
    }, [baseWallet, inputToken, outputToken, inputAmount]);

    // Search and fetch token metadata
    useEffect(() => {
        const fetchTokens = async () => {
            setIsLoading(true);
            try {
                // Handle input token
                if (args.inputTokenAddress && args.inputTokenAddress !== "ETH") {
                    // Check if it's an address or symbol
                    const isAddress = args.inputTokenAddress.startsWith('0x') && args.inputTokenAddress.length === 42;
                    
                    if (isAddress) {
                        // It's an address, fetch metadata directly
                        try {
                            const response = await fetch(`/api/token/${args.inputTokenAddress}/metadata?chain=base`);
                            if (response.ok) {
                                const metadata = await response.json();
                                setInputToken({
                                    id: args.inputTokenAddress,
                                    name: metadata.name || "Unknown Token",
                                    symbol: metadata.symbol || "UNKNOWN",
                                    logoURI: metadata.logo_uri || "",
                                    decimals: metadata.decimals || 18,
                                    tags: [],
                                    freezeAuthority: null,
                                    mintAuthority: null,
                                    permanentDelegate: null,
                                    extensions: {}
                                });
                            }
                        } catch (error) {
                            console.error('Error fetching token metadata by address:', error);
                        }
                    } else {
                        // It's a symbol, search for it
                        const searchQuery = args.inputTokenAddress.toUpperCase();
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
                }

                // Handle output token
                if (args.outputTokenAddress && args.outputTokenAddress !== "ETH") {
                    // Check if it's an address or symbol
                    const isAddress = args.outputTokenAddress.startsWith('0x') && args.outputTokenAddress.length === 42;
                    
                    if (isAddress) {
                        // It's an address, fetch metadata directly
                        try {
                            const response = await fetch(`/api/token/${args.outputTokenAddress}/metadata?chain=base`);
                            if (response.ok) {
                                const metadata = await response.json();
                                setOutputToken({
                                    id: args.outputTokenAddress,
                                    name: metadata.name || "Unknown Token",
                                    symbol: metadata.symbol || "UNKNOWN",
                                    logoURI: metadata.logo_uri || "",
                                    decimals: metadata.decimals || 18,
                                    tags: [],
                                    freezeAuthority: null,
                                    mintAuthority: null,
                                    permanentDelegate: null,
                                    extensions: {}
                                });
                            }
                        } catch (error) {
                            console.error('Error fetching token metadata by address:', error);
                        }
                    } else {
                        // It's a symbol, search for it
                        const searchQuery = args.outputTokenAddress.toUpperCase();
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
            // Get the sell token and buy token addresses
            const sellToken = inputToken.symbol === "ETH" ? "ETH" : inputToken.id;
            const buyToken = outputToken.symbol === "ETH" ? "ETH" : outputToken.id;

            // Calculate the sell amount in base units
            const sellAmountRaw = parseUnits(inputAmount, inputToken.decimals);

            console.log("Getting swap quote with params:", {
                sellToken,
                buyToken,
                sellAmount: sellAmountRaw.toString(),
                taker: baseWallet.address
            });

            const quoteUrl = `/api/swap/base/quote?` + new URLSearchParams({
                sellToken: sellToken,
                buyToken: buyToken,
                sellAmount: sellAmountRaw.toString(),
                taker: baseWallet.address
            }).toString();

            console.log("Quote URL:", quoteUrl);
            const quoteResponse = await fetch(quoteUrl);

            if (!quoteResponse.ok) {
                const errorData = await quoteResponse.json();
                console.error("Quote error:", errorData);
                throw new Error(`Failed to get swap quote: ${errorData.reason || errorData.message || 'Unknown error'}`);
            }

                          const quote = await quoteResponse.json();
              console.log("Received swap quote:", JSON.stringify(quote, null, 2));

              // Check for balance and allowance issues
              if (quote.issues) {
                  if (quote.issues.balance) {
                      const { token, actual, expected } = quote.issues.balance;
                      const tokenSymbol = token === "0x4200000000000000000000000000000000000006" ? "ETH" : inputToken.symbol;
                      const actualFormatted = formatUnits(BigInt(actual), inputToken.decimals);
                      const expectedFormatted = formatUnits(BigInt(expected), inputToken.decimals);
                      throw new Error(`Insufficient balance: have ${actualFormatted} ${tokenSymbol}, need ${expectedFormatted} ${tokenSymbol}`);
                  }

                  if (quote.issues.allowance && inputToken.symbol !== "ETH") {
                      console.log("Need to approve token spending...");
                      const client = createWalletClient({
                          account: baseWallet.address as Address,
                          chain: base,
                          transport: custom(await baseWallet.getEthereumProvider())
                      }).extend(publicActions);

                      // Approve via Permit2
                      const permit2Address = quote.issues.allowance.spender;
                      const approvalTx = await client.writeContract({
                          address: inputToken.id as Address,
                          abi: [{
                              name: 'approve',
                              type: 'function',
                              stateMutability: 'nonpayable',
                              inputs: [
                                  { name: 'spender', type: 'address' },
                                  { name: 'amount', type: 'uint256' }
                              ],
                              outputs: [{ type: 'bool' }]
                          }],
                          functionName: 'approve',
                          args: [permit2Address as Address, BigInt(quote.sellAmount)]
                      });

                      console.log("Approval transaction sent:", approvalTx);
                      throw new Error("Please try the swap again after approval is confirmed");
                  }
              }

              // Check if we have the required transaction data
              if (!quote.transaction?.to || !quote.transaction?.data) {
                  console.error("Missing required transaction data in quote:", quote);
                  throw new Error("Invalid quote response: missing transaction data");
              }

              // Calculate expected output amount
              const expectedOutput = formatUnits(BigInt(quote.buyAmount), outputToken.decimals);
              console.log(`Expected output: ${expectedOutput} ${outputToken.symbol}`);

            // Get the provider from the wallet
            const provider = await baseWallet.getEthereumProvider();
            
            // Create Viem wallet client
            const client = createWalletClient({
                account: baseWallet.address as Address,
                chain: base,
                transport: custom(provider)
            }).extend(publicActions);

            // Execute the swap using the transaction data from the quote
            console.log("Executing swap transaction...");
            const tx = await client.sendTransaction({
                account: baseWallet.address as Address,
                to: quote.transaction.to as Address,
                data: quote.transaction.data as `0x${string}`,
                value: quote.transaction.value ? BigInt(quote.transaction.value) : undefined,
                gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
                gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined
            });
            console.log("Swap transaction sent:", tx);

            addToolResult(toolCallId, {
                message: `Successfully swapped ${inputAmount} ${inputToken.symbol} for ${outputToken.symbol}`,
                body: {
                    transaction: tx as string,
                    inputAmount: Number(inputAmount),
                    inputToken: inputToken.symbol,
                    outputToken: outputToken.symbol,
                    walletAddress: args.walletAddress
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
        <Card className="p-2">
            <div className="flex flex-col gap-4 w-96 max-w-full">
                <div className="flex flex-col gap-2 items-center w-full">
                    <div className="w-full">
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
                        {balance && (
                            <div className="text-xs text-right mt-1 text-neutral-500">
                                Balance: {Number(balance).toFixed(6)} {inputToken?.symbol}
                            </div>
                        )}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="group h-fit w-fit p-1"
                        onClick={() => {
                            // Swap input and output tokens
                            const tempToken = inputToken;
                            const tempAmount = inputAmount;
                            setInputToken(outputToken);
                            setInputAmount(expectedOutput);
                            setOutputToken(tempToken);
                            setExpectedOutput(tempAmount);
                        }}
                    >
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    </Button>
                    <div className="w-full">
                        <TokenInput
                            token={outputToken}
                            label="Buy"
                            amount={expectedOutput}
                            onChange={undefined}
                            onChangeToken={(newToken) => {
                                setOutputToken(newToken);
                            }}
                            priorityTokens={priorityTokens}
                        />
                        {isGettingQuote && (
                            <div className="text-xs text-right mt-1 text-neutral-500">
                                Getting quote...
                            </div>
                        )}
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                    {
                        baseWallet ? (
                            <Button 
                                variant="brand" 
                                className="w-full"
                                onClick={onSwap}
                                disabled={
                                    isSwapping || 
                                    isGettingQuote || 
                                    !inputToken || 
                                    !outputToken || 
                                    !inputAmount || 
                                    Number(inputAmount) <= 0 ||
                                    !balance ||
                                    Number(inputAmount) > Number(balance)
                                }
                            >
                                {
                                    isGettingQuote 
                                        ? "Loading..." 
                                        : Number(inputAmount) > Number(balance)
                                            ? "Insufficient balance"
                                            : isSwapping
                                                ? "Swapping..."
                                                : "Swap"
                                }
                            </Button>
                        ) : (
                            <LogInButton />
                        )
                    }
                    <Button
                        variant="ghost"
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
            </div>
        </Card>
    );
};

export default SwapCallBody; 