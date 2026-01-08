'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useChain } from '@/app/_contexts/chain-context';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useTokenMetadata } from '@/hooks/queries/token/use-token-metadata';
import type { Token } from '@/db/types/token';
import type { ToolInvocation } from 'ai';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { BNB_METADATA, WBNB_ADDRESS, WBNB_METADATA } from '@/lib/config/bsc';
import { ERC20_ABI } from '@/lib/config/abis/erc20';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import ToolCard from '../../tool-card';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';
import LogInButton from '@/app/(app)/_components/log-in-button';
import { Skeleton } from '@/components/ui/skeleton';
import TokenInput from './token-input';

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

type BscToken = Token;

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

  // Set the current chain to BSC
  useEffect(() => {
    console.log('Setting current chain to BSC');
    setCurrentChain('bsc');
  }, [setCurrentChain]);

  console.log('Current chain in TransferCall:', currentChain);

  // Get the BSC wallet from args.walletAddress
  const bscWallet =
    wallets.find((w) => w.address === args.walletAddress) ||
    (user?.wallet?.address === args.walletAddress ? user.wallet : null);

  console.log('BSC wallet:', bscWallet?.address);

  // Default to BNB or WBNB based on address
  const [token, setToken] = useState<BscToken | null>(() => {
    if (!args.tokenAddress || args.tokenAddress === 'BNB') {
      return BNB_METADATA;
    }
    if (args.tokenAddress.toLowerCase() === WBNB_ADDRESS) {
      return WBNB_METADATA;
    }
    return null; // Will be set once we get token data
  });

  // Only fetch token metadata if we have a token address
  const {
    data: tokenData,
    isLoading: tokenLoading,
    error: tokenError,
  } = useTokenMetadata(args.tokenAddress && args.tokenAddress !== 'BNB' ? args.tokenAddress : '');

  // Add console logs to debug token metadata
  useEffect(() => {
    console.log('Token metadata request params:', {
      tokenAddress: args.tokenAddress,
      tokenSymbol: args.tokenSymbol,
      isLoading: tokenLoading,
      error: tokenError,
    });

    if (tokenError) {
      console.error('Token metadata fetch error:', tokenError);
    }

    if (tokenData) {
      console.log('Token metadata response:', tokenData);
    }
  }, [args.tokenAddress, args.tokenSymbol, tokenData, tokenLoading, tokenError]);

  useEffect(() => {
    if (tokenData && args.tokenAddress && args.tokenAddress !== 'BNB') {
      console.log('Setting token data from API:', tokenData);
      // Special handling for WBNB
      if (
        args.tokenAddress.toLowerCase() === WBNB_ADDRESS ||
        tokenData.symbol?.toUpperCase() === 'WBNB'
      ) {
        setToken(WBNB_METADATA);
        return;
      }
      setToken({
        id: args.tokenAddress,
        name: tokenData.name || 'Unknown Token',
        symbol: tokenData.symbol || args.tokenSymbol || 'UNKNOWN',
        logoURI: tokenData.logo_uri || '',
        decimals: tokenData.decimals || 18,
        tags: [],
        freezeAuthority: null,
        mintAuthority: null,
        permanentDelegate: null,
        extensions: {},
      });
    } else if (!tokenData && args.tokenSymbol && !args.tokenAddress) {
      console.log('Setting token data from symbol:', args.tokenSymbol);
      // Check if it's BNB/WBNB by symbol
      if (args.tokenSymbol.toUpperCase() === 'BNB') {
        setToken(BNB_METADATA);
      } else if (args.tokenSymbol.toUpperCase() === 'WBNB') {
        setToken(WBNB_METADATA);
      } else {
        setToken({
          id: 'BNB',
          name: args.tokenSymbol,
          symbol: args.tokenSymbol,
          logoURI: '',
          decimals: 18,
          tags: [],
          freezeAuthority: null,
          mintAuthority: null,
          permanentDelegate: null,
          extensions: {},
        });
      }
    } else if (!tokenData && args.tokenAddress && args.tokenAddress !== 'BNB') {
      console.log('No token data received, using fallback data for address:', args.tokenAddress);
      // Check if it's WBNB by address
      if (args.tokenAddress.toLowerCase() === WBNB_ADDRESS) {
        setToken(WBNB_METADATA);
        return;
      }
      // Fallback for when token metadata fails
      setToken({
        id: args.tokenAddress,
        name: args.tokenSymbol || 'Unknown Token',
        symbol: args.tokenSymbol || 'UNKNOWN',
        logoURI: '',
        decimals: 18,
        tags: [],
        freezeAuthority: null,
        mintAuthority: null,
        permanentDelegate: null,
        extensions: {},
      });
    } else if (args.tokenAddress === 'BNB' || (!args.tokenAddress && args.tokenSymbol === 'BNB')) {
      console.log('Setting BNB token data');
      setToken(BNB_METADATA);
    }
  }, [tokenData, args.tokenAddress, args.tokenSymbol]);

  const onTransfer = async () => {
    if (!bscWallet) {
      console.error('No BSC wallet found');
      addToolResult<TransferResult>(toolCallId, {
        message: 'No BSC wallet found',
        body: {
          success: false,
          error: 'No BSC wallet found',
        },
      });
      return;
    }

    if (!token) {
      console.error('No token selected');
      addToolResult<TransferResult>(toolCallId, {
        message: 'No token selected',
        body: {
          success: false,
          error: 'No token selected',
        },
      });
      return;
    }

    setIsTransferring(true);

    try {
      const signer = await (bscWallet as any).getEthersJsSigner();
      let tx;
      let symbol;

      if (!token || token.symbol === 'BNB') {
        // Transfer BNB
        console.log(`Transferring ${amount} BNB to ${toAddress}`);
        tx = await signer.sendTransaction({
          to: toAddress,
          value: ethers.parseEther(amount),
        });
        symbol = 'BNB';
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
          console.error('Error interacting with token contract:', error);
          throw new Error('Failed to interact with token contract');
        }
      }

      console.log('Transaction sent:', tx.hash);

      addToolResult<TransferResult>(toolCallId, {
        message: `Successfully transferred ${amount} ${symbol} to ${toAddress}`,
        body: {
          success: true,
          txHash: tx.hash,
          amount,
          symbol,
          to: toAddress,
        },
      });
    } catch (error) {
      console.error('Transfer error:', error);
      const message = toUserFacingErrorTextWithContext('Transfer failed.', error);
      addToolResult<TransferResult>(toolCallId, {
        message,
        body: {
          success: false,
          error: message,
        },
      });
    } finally {
      setIsTransferring(false);
    }
  };

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
        {bscWallet ? (
          <Button
            variant="brand"
            onClick={onTransfer}
            disabled={isTransferring || !token || !amount || Number(amount) <= 0 || !toAddress}
          >
            {isTransferring ? 'Transferring...' : 'Transfer'}
          </Button>
        ) : (
          <LogInButton />
        )}
        <Button
          variant="outline"
          onClick={() => {
            addToolResult<TransferResult>(toolCallId, {
              message: 'Transfer cancelled',
              body: {
                success: false,
                error: 'Transfer cancelled by user',
              },
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
  console.log('BSC Transfer component rendered', { tool, prevToolAgent });

  return (
    <ToolCard<TransferResult, TransferArgs>
      tool={tool}
      loadingText={`Preparing transfer...`}
      result={{
        heading: (result) => {
          console.log('Transfer result:', result);
          return result.body?.success
            ? `Transfer successful`
            : result.body?.error
              ? 'Transfer failed'
              : 'Confirm Transfer';
        },
        body: (result) => {
          console.log('Transfer result body:', result.body);
          if (result.body?.success) {
            return `Successfully transferred ${result.body.amount} ${result.body.symbol} to ${result.body.to}`;
          }
          if (result.body?.error) {
            return result.body.error;
          }
          // If no success or error, show the transfer UI
          return (
            <TransferCall
              toolCallId={tool.toolCallId}
              args={{
                to: tool.args.to,
                amount: tool.args.amount,
                tokenAddress: tool.args.tokenAddress,
                tokenSymbol: tool.args.tokenSymbol,
                walletAddress: tool.args.walletAddress,
              }}
            />
          );
        },
      }}
      prevToolAgent={prevToolAgent}
    />
  );
};

export default Transfer;
