'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRightIcon } from 'lucide-react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { Decimal } from 'decimal.js';
import { usePrivy } from '@privy-io/react-auth';
import { useLogin } from '@/hooks';
import * as Sentry from '@sentry/nextjs';

import {
  Card,
  Button,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/components/ui';
import type { MoralisPair } from '@/services/moralis/get-token-pairs';

// Contract addresses
const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

interface Props {
  pair: MoralisPair;
}

// ABIs
const erc20Abi = [
  'function approve(address spender, uint value) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
];

const routerAbi = [
  'function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function addLiquidity(address tokenA,address tokenB,uint amountADesired,uint amountBDesired,uint amountAMin,uint amountBMin,address to,uint deadline) returns (uint amountA, uint amountB, uint liquidity)',
];

const BscPool: React.FC<Props> = ({ pair }) => {
  const { user } = usePrivy();
  const { login, linkWallet } = useLogin({
    onError: (err: any) => {
      if (!err?.includes('exited_auth_flow')) {
        Sentry.captureException(err, {
          tags: {
            component: 'BscPool',
            action: 'login',
          },
        });
      }
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);

  const [hasApprovedTokens, setHasApprovedTokens] = useState(false);
  const poolRatioRef = useRef<{ baseReserve: Decimal; quoteReserve: Decimal } | null>(null);

  // Get token info from the pair
  const baseToken = pair.pair[0];
  const quoteToken = pair.pair[1];

  // Check if user has a wallet connected via Privy
  const isWalletConnected = !!user?.wallet?.address;

  // Handle wallet connection through Privy
  function handleConnectWallet() {
    if (user) {
      linkWallet();
    } else {
      login();
    }
  }

  // Load pool reserves on mount
  useEffect(() => {
    async function loadPoolReserves() {
      try {
        // Use Moralis API to get fresh pair reserves
        const response = await fetch(
          `/api/moralis/reserves?pairAddress=${pair.pair_address}&chain=0x38`,
        );

        if (!response.ok) {
          console.error(`API response not ok: ${response.status}`);
          return;
        }

        const reservesData = await response.json();
        const { reserve0, reserve1 } = reservesData;

        // Validate reserves
        if (!reserve0 || !reserve1) {
          console.error('Invalid reserves data:', reservesData);
          return;
        }

        // Store normalized reserves
        const baseReserveNormalized = new Decimal(reserve0).div(
          new Decimal(10).pow(baseToken.token_decimals),
        );
        const quoteReserveNormalized = new Decimal(reserve1).div(
          new Decimal(10).pow(quoteToken.token_decimals),
        );

        poolRatioRef.current = {
          baseReserve: baseReserveNormalized,
          quoteReserve: quoteReserveNormalized,
        };

        console.log('Pool reserves loaded successfully via API:', {
          baseReserve: baseReserveNormalized.toString(),
          quoteReserve: quoteReserveNormalized.toString(),
          ratio: quoteReserveNormalized.div(baseReserveNormalized).toString(),
        });
      } catch (err: any) {
        console.error('Failed to load pool reserves via API:', err);
        // Don't throw error - just log it and continue
        // The component will work without autofill if API fails
      }
    }

    // Only call if we have the required data
    if (pair.pair_address && baseToken?.token_decimals && quoteToken?.token_decimals) {
      loadPoolReserves();
    }
  }, [pair.pair_address, baseToken?.token_decimals, quoteToken?.token_decimals]);

  // Handle input changes instantly using cached ratio
  const handleBaseAmountChange = (value: string) => {
    setBaseAmount(value);
    // Reset approval status when amounts change
    setHasApprovedTokens(false);

    if (value && poolRatioRef.current) {
      // Use cached pool reserves ratio for instant updates
      const { baseReserve, quoteReserve } = poolRatioRef.current;
      const ratio = quoteReserve.div(baseReserve);
      const quoteAmount = new Decimal(value).mul(ratio);
      setQuoteAmount(quoteAmount.toString());
    }
  };

  const handleQuoteAmountChange = (value: string) => {
    setQuoteAmount(value);
    // Reset approval status when amounts change
    setHasApprovedTokens(false);

    if (value && poolRatioRef.current) {
      // Use cached pool reserves ratio for instant updates
      const { baseReserve, quoteReserve } = poolRatioRef.current;
      const ratio = baseReserve.div(quoteReserve);
      const baseAmount = new Decimal(value).mul(ratio);
      setBaseAmount(baseAmount.toString());
    }
  };

  // Refresh pool reserves periodically
  useEffect(() => {
    const refreshReserves = async () => {
      try {
        // Use Moralis API to get fresh pair reserves
        const response = await fetch(
          `/api/moralis/reserves?pairAddress=${pair.pair_address}&chain=0x38`,
        );

        if (!response.ok) {
          return;
        }

        const reservesData = await response.json();
        const { reserve0, reserve1 } = reservesData;

        // Validate reserves
        if (!reserve0 || !reserve1) {
          return;
        }

        // Store normalized reserves
        const baseReserveNormalized = new Decimal(reserve0).div(
          new Decimal(10).pow(baseToken.token_decimals),
        );
        const quoteReserveNormalized = new Decimal(reserve1).div(
          new Decimal(10).pow(quoteToken.token_decimals),
        );

        poolRatioRef.current = {
          baseReserve: baseReserveNormalized,
          quoteReserve: quoteReserveNormalized,
        };

        // Update amounts if they exist
        if (baseAmount && poolRatioRef.current) {
          const ratio = quoteReserveNormalized.div(baseReserveNormalized);
          const quoteAmount = new Decimal(baseAmount).mul(ratio);
          setQuoteAmount(quoteAmount.toString());
        } else if (quoteAmount && poolRatioRef.current) {
          const ratio = baseReserveNormalized.div(quoteReserveNormalized);
          const baseAmount = new Decimal(quoteAmount).mul(ratio);
          setBaseAmount(baseAmount.toString());
        }
      } catch (err: any) {
        // Silently handle errors for pool reserves refresh - don't spam console
        if (
          err.message &&
          !err.message.includes('missing revert data') &&
          !err.message.includes('CALL_EXCEPTION')
        ) {
          console.error('Failed to refresh pool reserves:', err);
        }
      }
    };

    // Refresh every 10 seconds
    const interval = setInterval(refreshReserves, 10000);
    return () => clearInterval(interval);
  }, [
    pair.pair_address,
    baseToken.token_address,
    baseToken.token_decimals,
    quoteToken.token_decimals,
    baseAmount,
    quoteAmount,
  ]);

  // Create a link to BscScan for the pair
  const bscScanUrl = `https://bscscan.com/address/${pair.pair_address}`;

  // Default token logo if missing
  const defaultTokenLogo = '/placeholder-token.png';

  async function getSigner() {
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      return provider.getSigner();
    } catch (err: any) {
      console.error('Failed to get signer:', err);
      setStatus('Please connect your wallet first');
      throw err;
    }
  }

  async function approveTokens() {
    try {
      setIsApproving(true);

      // Ensure we're on BSC network before proceeding
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(56)) {
        setStatus('Please switch to BSC network in your wallet (MetaMask → Networks → BSC)');
        setIsApproving(false);
        return;
      }

      const signer = await getSigner();

      // Approve base token
      const baseTokenContract = new Contract(baseToken.token_address, erc20Abi, signer);
      setStatus(`Approving ${baseToken.token_symbol}...`);
      const baseTx = await baseTokenContract.approve(
        PANCAKE_ROUTER,
        parseUnits(baseAmount, Number(baseToken.token_decimals)),
      );
      await baseTx.wait();

      // Approve quote token if not BNB
      if (quoteToken.token_address.toLowerCase() !== '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
        const quoteTokenContract = new Contract(quoteToken.token_address, erc20Abi, signer);
        setStatus(`Approving ${quoteToken.token_symbol}...`);
        const quoteTx = await quoteTokenContract.approve(
          PANCAKE_ROUTER,
          parseUnits(quoteAmount, Number(quoteToken.token_decimals)),
        );
        await quoteTx.wait();
      }

      setStatus('Tokens approved successfully!');
      setHasApprovedTokens(true);
    } catch (err: any) {
      console.error('Approval failed:', err);

      // Check if user rejected the transaction
      if (
        err.message &&
        (err.message.includes('user rejected action') ||
          err.message.includes('User denied transaction signature') ||
          err.message.includes('ACTION_REJECTED'))
      ) {
        setStatus('Rejected by user');
      } else {
        setStatus(`Approval failed: ${err.message}`);
      }
    } finally {
      setIsApproving(false);
    }
  }

  async function addLiquidity() {
    try {
      setIsAddingLiquidity(true);

      // Ensure we're on BSC network before proceeding
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(56)) {
        setStatus('Please switch to BSC network in your wallet\n(MetaMask → Networks → BSC)');
        setIsAddingLiquidity(false);
        return;
      }

      const signer = await getSigner();
      const router = new Contract(PANCAKE_ROUTER, routerAbi, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      setStatus('Adding liquidity...');

      let tx;
      // If quote token is BNB/WBNB
      if (quoteToken.token_address.toLowerCase() === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
        tx = await router.addLiquidityETH(
          baseToken.token_address,
          parseUnits(baseAmount, Number(baseToken.token_decimals)),
          0, // slippage handled by frontend
          0, // slippage handled by frontend
          await signer.getAddress(),
          deadline,
          { value: parseUnits(Number(quoteAmount).toFixed(18), 18) },
        );
      } else {
        tx = await router.addLiquidity(
          baseToken.token_address,
          quoteToken.token_address,
          parseUnits(
            Number(baseAmount).toFixed(Number(baseToken.token_decimals)),
            Number(baseToken.token_decimals),
          ),
          parseUnits(
            Number(quoteAmount).toFixed(Number(quoteToken.token_decimals)),
            Number(quoteToken.token_decimals),
          ),
          0, // slippage handled by frontend
          0, // slippage handled by frontend
          await signer.getAddress(),
          deadline,
        );
      }

      await tx.wait();
      setStatus('Liquidity added successfully!');
      setIsOpen(false);
      setBaseAmount('');
      setQuoteAmount('');
    } catch (err: any) {
      console.error('Failed to add liquidity:', err);

      // Check if it's a transfer failure (insufficient balance)
      if (
        err.message &&
        (err.message.includes('TRANSFER_FROM_FAILED') ||
          err.message.includes('missing revert data') ||
          err.message.includes('CALL_EXCEPTION'))
      ) {
        setStatus('Insufficient balance');
      } else {
        setStatus(`Failed to add liquidity: ${err.message}`);
      }
    } finally {
      setIsAddingLiquidity(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-8">
              {baseToken.token_logo ? (
                <Image
                  src={baseToken.token_logo}
                  alt={baseToken.token_name}
                  width={24}
                  height={24}
                  className="rounded-full absolute top-0 left-0"
                  onError={(e) => {
                    // Fallback to default image on error
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = defaultTokenLogo;
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 absolute top-0 left-0 flex items-center justify-center">
                  <span className="text-xs">{baseToken.token_symbol?.charAt(0) || '?'}</span>
                </div>
              )}
              {quoteToken.token_logo ? (
                <Image
                  src={quoteToken.token_logo}
                  alt={quoteToken.token_name}
                  width={24}
                  height={24}
                  className="rounded-full absolute bottom-0 right-0"
                  onError={(e) => {
                    // Fallback to default image on error
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = defaultTokenLogo;
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 absolute bottom-0 right-0 flex items-center justify-center">
                  <span className="text-xs">{quoteToken.token_symbol?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <h3>
              {baseToken.token_symbol || 'Unknown'} / {quoteToken.token_symbol || 'Unknown'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Link href={bscScanUrl} target="_blank">
              <Button variant="ghost" size="sm">
                BscScan
                <ArrowUpRightIcon className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600"
            >
              Add Liquidity
            </Button>
          </div>
        </div>

        {/* Add Liquidity Modal */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {baseToken.token_logo ? (
                    <Image
                      src={baseToken.token_logo}
                      alt={baseToken.token_name}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = defaultTokenLogo;
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                      {baseToken.token_symbol.charAt(0)}
                    </div>
                  )}
                  <span>/</span>
                  {quoteToken.token_logo ? (
                    <Image
                      src={quoteToken.token_logo}
                      alt={quoteToken.token_name}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = defaultTokenLogo;
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                      {quoteToken.token_symbol.charAt(0)}
                    </div>
                  )}
                </div>
                Add Liquidity
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              {!isWalletConnected ? (
                <div className="flex flex-col gap-4 items-center">
                  <p className="text-sm text-gray-500">
                    Please connect your wallet to add liquidity
                  </p>
                  <Button onClick={handleConnectWallet}>Connect Wallet</Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{baseToken.token_symbol} Amount</label>
                    <Input
                      type="text"
                      placeholder={`Enter ${baseToken.token_symbol} amount`}
                      value={baseAmount}
                      onChange={(e) => handleBaseAmountChange(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{quoteToken.token_symbol} Amount</label>
                    <Input
                      type="text"
                      placeholder={`Enter ${quoteToken.token_symbol} amount`}
                      value={quoteAmount}
                      onChange={(e) => handleQuoteAmountChange(e.target.value)}
                    />
                  </div>

                  {status && <p className="text-sm text-gray-500">{status}</p>}

                  <div className="flex gap-2">
                    {!hasApprovedTokens ? (
                      <Button
                        variant="outline"
                        onClick={approveTokens}
                        disabled={isApproving || !baseAmount || !quoteAmount}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600"
                      >
                        {isApproving ? 'Approving...' : 'Approve Tokens'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={addLiquidity}
                        disabled={isAddingLiquidity || !baseAmount || !quoteAmount}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600 !important"
                        style={{
                          backgroundColor: '#eab308',
                          borderColor: '#eab308',
                          color: 'white',
                        }}
                      >
                        {isAddingLiquidity ? 'Adding...' : 'Add Liquidity'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full justify-between">
            <div className="flex flex-col justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                  Liquidity
                </h3>
                <p className="text-sm font-medium">
                  $
                  {typeof pair.liquidity_usd === 'number'
                    ? pair.liquidity_usd.toLocaleString()
                    : '0'}
                </p>
              </div>
              <Separator />
            </div>
            <div className="flex flex-col justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                  Volume 24h
                </h3>
                <p className="text-sm font-medium">
                  $
                  {typeof pair.volume_24h_usd === 'number'
                    ? pair.volume_24h_usd.toLocaleString()
                    : '0'}
                </p>
              </div>
              <Separator />
            </div>
            <div className="flex flex-col justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                  Price
                </h3>
                <p className="text-sm font-medium">
                  ${typeof pair.usd_price === 'number' ? pair.usd_price.toLocaleString() : '0'}
                </p>
              </div>
              <Separator />
            </div>
            <div className="flex flex-col justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                  24h Change
                </h3>
                <p
                  className={`text-sm font-medium ${(pair.usd_price_24hr_percent_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {(pair.usd_price_24hr_percent_change || 0) >= 0 ? '+' : ''}
                  {typeof pair.usd_price_24hr_percent_change === 'number'
                    ? pair.usd_price_24hr_percent_change.toFixed(2)
                    : '0.00'}
                  %
                </p>
              </div>
              <Separator />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BscPool;
