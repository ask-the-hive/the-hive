'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { BN } from '@project-serum/anchor';
import { ApiV3PoolInfoStandardItem, TxVersion } from '@raydium-io/raydium-sdk-v2';
import Decimal from 'decimal.js';
import { Button, Separator } from '@/components/ui';
import LogInButton from '@/app/(app)/_components/log-in-button';
import LpTokenInput from './lp-token-input';
import { useSendTransaction, useTokenBalance } from '@/hooks';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { raydiumTransactionClient } from '@/services/raydium';
import type { SolanaWithdrawLiquidityResultBodyType } from '@/ai';

interface Props {
  pool: ApiV3PoolInfoStandardItem;
  toolCallId: string;
}

const StandardPool: React.FC<Props> = ({ pool, toolCallId }) => {
  const { addToolResult } = useChat();
  const [amount, setAmount] = useState<string>('');
  const [amountsLoading, setAmountsLoading] = useState<boolean>(false);
  const [withdrawAmountA, setWithdrawAmountA] = useState<string>('0');
  const [withdrawAmountB, setWithdrawAmountB] = useState<string>('0');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const { sendTransaction, wallet } = useSendTransaction();
  const { balance, isLoading: isBalanceLoading } = useTokenBalance(
    pool.lpMint.address,
    wallet?.address ?? '',
  );

  const handleAmountChange = async (amount: string) => {
    setAmount(amount);
    setAmountsLoading(true);
    const [baseRatio, quoteRatio] = [
      new Decimal(pool.mintAmountA).div(pool.lpAmount || 1),
      new Decimal(pool.mintAmountB).div(pool.lpAmount || 1),
    ];

    const withdrawAmountDe = new Decimal(amount);
    const [withdrawAmountA, withdrawAmountB] = [
      withdrawAmountDe.mul(baseRatio).mul(10 ** (pool?.mintA.decimals || 0)),
      withdrawAmountDe.mul(quoteRatio).mul(10 ** (pool?.mintB.decimals || 0)),
    ];
    setWithdrawAmountA(withdrawAmountA.toFixed(0));
    setWithdrawAmountB(withdrawAmountB.toFixed(0));
    setAmountsLoading(false);
  };

  const onSubmit = async () => {
    if (!wallet || !wallet.address) return;
    setIsWithdrawing(true);
    try {
      const lpSlippage = 0.1;
      const raydium = await raydiumTransactionClient(wallet.address);
      const { transaction } = await raydium.liquidity.removeLiquidity({
        poolInfo: pool,
        lpAmount: new BN(Number(amount) * 10 ** pool.lpMint.decimals),
        baseAmountMin: new BN(new Decimal(withdrawAmountA).mul(1 - lpSlippage).toFixed(0)),
        quoteAmountMin: new BN(new Decimal(withdrawAmountB).mul(1 - lpSlippage).toFixed(0)),
        txVersion: TxVersion.V0,
      });
      const txHash = await sendTransaction(transaction);
      addToolResult<SolanaWithdrawLiquidityResultBodyType>(toolCallId, {
        message:
          'Withdraw liquidity successful. The user is shown the transaction hash, so you do not have to repeat it. Ask what they want to do next.',
        body: {
          transaction: txHash,
        },
      });
    } catch (error) {
      console.error(error);
    }
    setIsWithdrawing(false);
  };

  const onCancel = () => {
    addToolResult(toolCallId, {
      message: 'Withdraw liquidity cancelled',
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <p className="text-lg font-bold">
          {pool.mintA.symbol}/{pool.mintB.symbol}
        </p>
        <div className="flex flex-col items-center">
          <p className="text-xs opacity-50">7d APR</p>
          <p className="text-sm">{pool.week.apr}%</p>
        </div>
      </div>
      <LpTokenInput
        label={'LP Token'}
        amount={amount}
        onChange={handleAmountChange}
        pool={pool}
        lpMint={pool.lpMint.address}
        address={wallet?.address ?? ''}
      />
      <div className="flex flex-col items-center gap-2">
        <ChevronDown className="w-4 h-4" />
        <div className="flex gap-2 w-full">
          <OutputToken
            symbol={pool.mintA.symbol}
            amount={withdrawAmountA}
            logoURI={pool.mintA.logoURI}
            decimals={pool.mintA.decimals}
          />
          <OutputToken
            symbol={pool.mintB.symbol}
            amount={withdrawAmountB}
            logoURI={pool.mintB.logoURI}
            decimals={pool.mintB.decimals}
          />
        </div>
      </div>
      <Separator />
      {wallet ? (
        <div className="flex flex-col gap-2">
          <Button
            variant="brand"
            className="w-full"
            disabled={
              !amount ||
              !withdrawAmountA ||
              !withdrawAmountB ||
              isWithdrawing ||
              !balance ||
              isBalanceLoading ||
              Number(amount) > Number(balance) ||
              amountsLoading
            }
            onClick={onSubmit}
          >
            {isBalanceLoading || amountsLoading
              ? 'Loading...'
              : Number(amount) > Number(balance)
                ? 'Insufficient balance'
                : isWithdrawing
                  ? 'Withdrawing...'
                  : 'Withdraw'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <LogInButton />
      )}
    </div>
  );
};

export const OutputToken = ({
  symbol,
  amount,
  logoURI,
  decimals,
}: {
  symbol: string;
  amount: string;
  logoURI: string;
  decimals: number;
}) => {
  return (
    <div className="flex gap-2 items-center bg-neutral-100 dark:bg-neutral-700 rounded-md p-2 flex-1">
      <Image
        src={logoURI || 'https://www.birdeye.so/images/unknown-token-icon.svg'}
        alt={symbol}
        width={24}
        height={24}
        className="w-6 h-6 rounded-full object-cover"
        unoptimized
      />
      <div className="flex flex-col">
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{symbol}</p>
        <p className="text-sm">
          {new Decimal(amount)
            .div(10 ** decimals)
            .toNumber()
            .toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default StandardPool;
