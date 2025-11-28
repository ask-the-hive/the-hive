'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, type ConnectedWallet } from '@privy-io/react-auth';
import { useChain } from '@/app/_contexts/chain-context';
import { useLogin } from '@/hooks';
import { BNB_METADATA, WBNB_ADDRESS } from '@/lib/config/bsc';
import * as Sentry from '@sentry/nextjs';
import type { TradeArgumentsType, TradeResultBodyType } from '@/ai/bsc/actions/trade/actions/types';
import TokenInput from '../../bsc/transfer/token-input';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import type { Token } from '@/db/types/token';
import {
  createWalletClient,
  custom,
  publicActions,
  parseUnits,
  formatUnits,
  type Address,
} from 'viem';
// Use BSC RPC URL from env
const bscChain = {
  ...bsc,
  rpcUrls: {
    default: {
      http: [
        `${process.env.NEXT_PUBLIC_BSC_RPC_URL}?apiKey=${process.env.NEXT_PUBLIC_ANKR_API_KEY}` ||
          'https://bsc-dataseed.binance.org',
      ],
    },
    public: {
      http: [
        `${process.env.NEXT_PUBLIC_BSC_RPC_URL}?apiKey=${process.env.NEXT_PUBLIC_ANKR_API_KEY}` ||
          'https://bsc-dataseed.binance.org',
      ],
    },
  },
} as const;

import { bsc } from 'viem/chains';

interface Props {
  toolCallId: string;
  args: TradeArgumentsType;
}

const SwapCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const { user } = usePrivy();
  const { login, linkWallet } = useLogin({
    onError: (err: any) => {
      if (!err?.includes('exited_auth_flow')) {
        Sentry.captureException(err, {
          tags: {
            component: 'BSCTradeCall',
            action: 'login',
          },
        });
      }
    },
  });
  const { wallets } = useWallets();
  const { setCurrentChain } = useChain();
  const [isSwapping, setIsSwapping] = useState(false);

  // Check if user has a wallet connected
  const hasConnectedWallet = wallets.length > 0;
  const [inputAmount, setInputAmount] = useState<string>(args.inputAmount?.toString() || '');
  const [isLoading, setIsLoading] = useState(true);
  const [expectedOutput, setExpectedOutput] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  // Set the current chain to BSC
  useEffect(() => {
    setCurrentChain('bsc');
  }, [setCurrentChain]);

  // Get the BSC wallet from args.walletAddress
  const bscWallet = (wallets.find((w) => w.address === args.walletAddress) ||
    (user?.wallet?.address === args.walletAddress ? user.wallet : null)) as ConnectedWallet | null;

  // Default to BNB or WBNB based on address for input token
  const [inputToken, setInputToken] = useState<Token | null>(() => {
    if (!args.inputTokenAddress || args.inputTokenAddress === 'BNB') {
      return BNB_METADATA;
    }
    return null;
  });

  // Default to BNB or WBNB based on address for output token
  const [outputToken, setOutputToken] = useState<Token | null>(() => {
    if (!args.outputTokenAddress || args.outputTokenAddress === 'BNB') {
      return BNB_METADATA;
    }
    return null;
  });

  // Get balance when input token changes
  useEffect(() => {
    const getBalance = async () => {
      if (!bscWallet || !inputToken) return;

      try {
        const client = createWalletClient({
          account: bscWallet.address as Address,
          chain: bscChain,
          transport: custom(await bscWallet.getEthereumProvider()),
        }).extend(publicActions);

        let tokenBalance: bigint;
        if (inputToken.symbol === 'BNB') {
          tokenBalance = await client.getBalance({ address: bscWallet.address as Address });
        } else {
          tokenBalance = await client.readContract({
            address: inputToken.id as Address,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }],
              },
            ],
            functionName: 'balanceOf',
            args: [bscWallet.address as Address],
          });
        }

        setBalance(formatUnits(tokenBalance, inputToken.decimals));
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    };

    getBalance();
  }, [bscWallet, inputToken]);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!bscWallet || !inputToken || !outputToken || !inputAmount || Number(inputAmount) <= 0) {
        setExpectedOutput('');
        return;
      }

      setIsGettingQuote(true);
      try {
        const sellAmountRaw = parseUnits(inputAmount, inputToken.decimals);
        const sellToken = inputToken.symbol === 'BNB' ? 'BNB' : inputToken.id;
        const buyToken = outputToken.symbol === 'BNB' ? 'BNB' : outputToken.id;

        const quoteResponse = await fetch(
          `/api/swap/bsc/quote?` +
            new URLSearchParams({
              chainId: '56', // BSC chain ID
              sellToken: sellToken === 'BNB' ? WBNB_ADDRESS : sellToken,
              buyToken: buyToken === 'BNB' ? WBNB_ADDRESS : buyToken,
              sellAmount: sellAmountRaw.toString(),
              taker: bscWallet.address,
            }).toString(),
        );

        if (quoteResponse.ok) {
          const quote = await quoteResponse.json();
          setExpectedOutput(formatUnits(BigInt(quote.buyAmount), outputToken.decimals));
        }
      } catch (error) {
        console.error('Error getting quote:', error);
        setExpectedOutput('');
      } finally {
        setIsGettingQuote(false);
      }
    };

    getQuote();
  }, [bscWallet, inputToken, outputToken, inputAmount]);

  // Search and fetch token metadata
  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        // Handle input token
        if (args.inputTokenAddress && args.inputTokenAddress !== 'BNB') {
          // Always use uppercase symbol for search
          const searchQuery = args.inputTokenAddress.toUpperCase();
          // Search for token using the API endpoint
          const response = await fetch(
            `/api/token/search?query=${encodeURIComponent(searchQuery)}&chain=bsc&search_mode=fuzzy`,
          );
          const data = await response.json();

          const token = data.tokens?.[0];
          if (token) {
            setInputToken({
              id: token.address,
              name: token.name || 'Unknown Token',
              symbol: token.symbol || 'UNKNOWN',
              logoURI: token.logo_uri || '',
              decimals: 18, // Default to 18 decimals for BSC tokens
              tags: [],
              freezeAuthority: null,
              mintAuthority: null,
              permanentDelegate: null,
              extensions: {},
            });
          }
        }

        // Handle output token
        if (args.outputTokenAddress && args.outputTokenAddress !== 'BNB') {
          // Always use uppercase symbol for search
          const searchQuery = args.outputTokenAddress.toUpperCase();
          // Search for token using the API endpoint
          const response = await fetch(
            `/api/token/search?query=${encodeURIComponent(searchQuery)}&chain=bsc&search_mode=fuzzy`,
          );
          const data = await response.json();

          const token = data.tokens?.[0];
          if (token) {
            setOutputToken({
              id: token.address,
              name: token.name || 'Unknown Token',
              symbol: token.symbol || 'UNKNOWN',
              logoURI: token.logo_uri || '',
              decimals: 18, // Default to 18 decimals for BSC tokens
              tags: [],
              freezeAuthority: null,
              mintAuthority: null,
              permanentDelegate: null,
              extensions: {},
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
    if (!bscWallet) {
      addToolResult<TradeResultBodyType>(toolCallId, {
        message: 'No BSC wallet found',
        body: {
          transaction: '',
          inputAmount: 0,
          inputToken: '',
          outputToken: '',
          walletAddress: args.walletAddress,
          error: 'No BSC wallet found',
        },
      });
      return;
    }

    if (!inputToken || !outputToken) {
      addToolResult<TradeResultBodyType>(toolCallId, {
        message: 'Please select both input and output tokens',
        body: {
          transaction: '',
          inputAmount: 0,
          inputToken: '',
          outputToken: '',
          walletAddress: args.walletAddress,
          error: 'Please select both input and output tokens',
        },
      });
      return;
    }

    setIsSwapping(true);

    try {
      // Get the provider from the wallet
      const provider = await (bscWallet as any).getEthereumProvider();

      // Create Viem wallet client
      const client = createWalletClient({
        account: bscWallet.address as Address,
        chain: bscChain,
        transport: custom(provider),
      }).extend(publicActions);

      // Calculate sell amount in token decimals
      const sellAmountRaw = parseUnits(inputAmount, Number(inputToken.decimals));

      const sellToken = inputToken.id === 'BNB' ? 'BNB' : inputToken.id;
      const buyToken = outputToken.id === 'BNB' ? 'BNB' : outputToken.id;

      // Check user's balance first
      let balance: bigint;
      if (sellToken === 'BNB') {
        balance = await client.getBalance({ address: bscWallet.address as Address });
      } else {
        balance = await client.readContract({
          address: sellToken as Address,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ],
          functionName: 'balanceOf',
          args: [bscWallet.address as Address],
        });
      }

      if (balance < sellAmountRaw) {
        throw new Error(
          `Insufficient balance: ${formatUnits(balance, inputToken.decimals)} ${inputToken.symbol} < ${inputAmount} ${inputToken.symbol}`,
        );
      }

      // Get the quote with transaction data
      console.log('Getting swap quote...');
      const quoteResponse = await fetch(
        `/api/swap/bsc/quote?` +
          new URLSearchParams({
            sellToken: sellToken === 'BNB' ? WBNB_ADDRESS : sellToken,
            buyToken: buyToken === 'BNB' ? WBNB_ADDRESS : buyToken,
            sellAmount: sellAmountRaw.toString(),
            taker: bscWallet.address,
          }).toString(),
      );

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        console.error('Quote error:', errorData);
        throw new Error(
          `Failed to get swap quote: ${errorData.reason || errorData.message || 'Unknown error'}`,
        );
      }

      const quote = await quoteResponse.json();
      console.log('Received swap quote:', quote);

      // Execute the swap using the transaction data from the quote
      console.log('Executing swap transaction...');
      const tx = await client.sendTransaction({
        account: bscWallet.address as Address,
        to: quote.transaction.to as Address,
        data: quote.transaction.data as `0x${string}`,
        value: quote.transaction.value ? BigInt(quote.transaction.value) : undefined,
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined,
      });
      console.log('Swap transaction sent:', tx);

      addToolResult<TradeResultBodyType>(toolCallId, {
        message: `Successfully swapped ${inputAmount} ${inputToken.symbol} for ${formatUnits(BigInt(quote.buyAmount), outputToken.decimals)} ${outputToken.symbol}`,
        body: {
          transaction: tx,
          inputAmount: Number(inputAmount),
          inputToken: inputToken.symbol,
          outputToken: outputToken.symbol,
          walletAddress: args.walletAddress,
          success: true,
        },
      });
    } catch (error) {
      console.error('Swap error:', error);
      addToolResult<TradeResultBodyType>(toolCallId, {
        message: `Swap failed: ${error instanceof Error ? error.message : String(error)}`,
        body: {
          transaction: '',
          inputAmount: 0,
          inputToken: '',
          outputToken: '',
          walletAddress: args.walletAddress,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      setIsSwapping(false);
    }
  };

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
            />
            {isGettingQuote && (
              <div className="text-xs text-right mt-1 text-neutral-500">Getting quote...</div>
            )}
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <Button
            variant="brand"
            className="w-full"
            onClick={
              hasConnectedWallet
                ? onSwap
                : () => {
                    if (user) {
                      linkWallet();
                    } else {
                      login();
                    }
                  }
            }
            disabled={
              hasConnectedWallet
                ? isSwapping ||
                  isGettingQuote ||
                  !inputToken ||
                  !outputToken ||
                  !inputAmount ||
                  Number(inputAmount) <= 0 ||
                  !balance ||
                  Number(inputAmount) > Number(balance)
                : false
            }
          >
            {!hasConnectedWallet
              ? 'Connect Wallet'
              : isGettingQuote
                ? 'Loading...'
                : Number(inputAmount) > Number(balance)
                  ? 'Insufficient balance'
                  : isSwapping
                    ? 'Swapping...'
                    : 'Swap'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              addToolResult<TradeResultBodyType>(toolCallId, {
                message: 'Swap cancelled by user',
                body: {
                  transaction: '',
                  inputAmount: Number(inputAmount || '0'),
                  inputToken: inputToken?.symbol || '',
                  outputToken: outputToken?.symbol || '',
                  walletAddress: args.walletAddress,
                  success: false,
                  error: 'Swap cancelled by user',
                },
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
