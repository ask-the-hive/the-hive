import React, { useEffect, useMemo, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../../tool-card';
import { Card, Button, Skeleton } from '@/components/ui';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import WithdrawResult from './withdraw-result';

import type { ToolInvocation } from 'ai';
import type {
  WithdrawArgumentsType,
  WithdrawResultBodyType,
} from '@/ai/solana/actions/lending/withdraw/schema';
import type { WithdrawResultType } from '@/ai';
import type { LendingPosition } from '@/types/lending-position';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';
import TokenInput from '@/app/_components/swap/token-input';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import { useRouter } from 'next/navigation';

const normalizeKey = (value: unknown) => {
  const text = String(value ?? '').toLowerCase();
  let result = '';
  for (let idx = 0; idx < text.length; idx += 1) {
    const code = text.charCodeAt(idx);
    const isDigit = code >= 48 && code <= 57;
    const isLower = code >= 97 && code <= 122;
    if (isDigit || isLower) result += text[idx];
  }
  return result;
};

const looksLikeUserCancellation = (error: unknown) => {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase();
  return (
    message.includes('user rejected') ||
    message.includes('user cancelled') ||
    message.includes('user denied') ||
    message.includes('rejected by user') ||
    (error as any)?.code === 4001
  );
};

const WithdrawCall: React.FC<{ toolCallId: string; args: WithdrawArgumentsType }> = ({
  toolCallId,
  args,
}) => {
  const { addToolResult } = useChat();
  const { wallet, sendTransaction } = useSendTransaction();
  const router = useRouter();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [positions, setPositions] = useState<LendingPosition[]>([]);
  const [position, setPosition] = useState<LendingPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(true);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [amount, setAmount] = useState(() => String(args.amount ?? ''));
  const [isNavigating, setIsNavigating] = useState(false);

  const normalizedArgsToken = useMemo(() => normalizeKey(args.tokenAddress), [args.tokenAddress]);
  const normalizedArgsProtocol = useMemo(
    () => normalizeKey(args.protocolAddress),
    [args.protocolAddress],
  );

  useEffect(() => {
    setAmount(String(args.amount ?? ''));
  }, [args.amount]);

  useEffect(() => {
    let cancelled = false;

    const loadPositions = async () => {
      setPositionLoading(true);
      setPositionError(null);
      setPosition(null);
      setPositions([]);

      try {
        const res = await fetch(`/api/lending-positions/${args.walletAddress}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch lending positions');
        }
        const positions = (await res.json()) as LendingPosition[];
        const tokenSpecified = Boolean(normalizedArgsToken);
        const protocolSpecified = Boolean(normalizedArgsProtocol);

        const match =
          tokenSpecified || protocolSpecified
            ? positions.find((p) => {
                const tokenMint = p.poolData?.tokenMintAddress || p.token?.id || '';
                const tokenKey = normalizeKey(tokenMint);
                const protocolKey = normalizeKey(p.protocol);

                const tokenMatches = !normalizedArgsToken || tokenKey === normalizedArgsToken;
                const protocolMatches =
                  !normalizedArgsProtocol ||
                  (protocolKey && protocolKey.includes(normalizedArgsProtocol)) ||
                  (normalizedArgsProtocol && normalizedArgsProtocol.includes(protocolKey));

                return tokenMatches && protocolMatches;
              })
            : null;

        if (!cancelled) {
          setPositions(Array.isArray(positions) ? positions : []);
          setPosition(match ?? null);
          setAmount((prev) => (prev ? prev : match ? String(match.amount) : ''));
        }
      } catch (err) {
        if (!cancelled) {
          setPositionError(
            toUserFacingErrorTextWithContext('Failed to load lending positions.', err),
          );
        }
      } finally {
        if (!cancelled) setPositionLoading(false);
      }
    };

    void loadPositions();
    return () => {
      cancelled = true;
    };
  }, [args.walletAddress, normalizedArgsProtocol, normalizedArgsToken]);

  const walletMismatch =
    wallet?.address &&
    args.walletAddress &&
    wallet.address.toLowerCase() !== args.walletAddress.toLowerCase();

  const handleViewPortfolio = async () => {
    if (!args.walletAddress || isNavigating) return;
    setIsNavigating(true);
    try {
      await router.push(`/portfolio/${args.walletAddress}`);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet?.address || !sendTransaction || !position || !amount) return;
    if (walletMismatch) return;

    setIsWithdrawing(true);

    try {
      const amountNumber = Number(amount);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) return;

      if (amountNumber > position.amount) {
        addToolResult<WithdrawResultBodyType>(toolCallId, {
          message:
            "You don't have enough balance in this lending position to withdraw that amount. Next: enter a smaller amount.",
          body: {
            status: 'failed',
            tx: '',
            amount: amountNumber,
            tokenSymbol: position.token.symbol,
            protocolName: position.protocol,
            error: 'Insufficient lending position',
          },
        });
        return;
      }

      posthog.capture('lend_withdraw_initiated', {
        amount: amountNumber,
        tokenSymbol: position.token.symbol,
        protocolName: position.protocol,
      });

      const response = await fetch('/api/lending/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: position.protocol,
          tokenMint: position.poolData.tokenMintAddress || position.token.id,
          tokenSymbol: position.token.symbol,
          amount: amountNumber,
          walletAddress: wallet.address,
          shares: position.sharesRaw,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to build withdraw transaction');
      }

      const { transaction: serializedTx } = (await response.json()) as { transaction: string };
      const tx = await sendTransaction(
        VersionedTransaction.deserialize(Buffer.from(serializedTx, 'base64')),
      );

      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
      const confirmation = await connection.confirmTransaction(tx, 'confirmed');
      if (confirmation.value.err) {
        throw new Error('Transaction failed on-chain.');
      }

      posthog.capture('lend_withdraw_confirmed', {
        amount: amountNumber,
        tokenSymbol: position.token.symbol,
        protocolName: position.protocol,
      });

      addToolResult<WithdrawResultBodyType>(toolCallId, {
        message: `Successfully withdrew ${amountNumber} ${position.token.symbol} from ${position.protocol}`,
        body: {
          status: 'complete',
          tx,
          amount: amountNumber,
          tokenSymbol: position.token.symbol,
          protocolName: position.protocol,
        },
      });
    } catch (error) {
      if (looksLikeUserCancellation(error)) {
        addToolResult<WithdrawResultBodyType>(toolCallId, {
          message: 'Transaction cancelled by user',
          body: {
            status: 'cancelled',
            tx: '',
            amount: Number(amount || 0),
          },
        });
      } else {
        Sentry.captureException(error);
        addToolResult<WithdrawResultBodyType>(toolCallId, {
          message: toUserFacingErrorTextWithContext(
            "Couldn't complete the withdrawal right now.",
            error,
          ),
          body: {
            status: 'failed',
            tx: '',
            amount: Number(amount || 0),
            tokenSymbol: position?.token?.symbol,
            protocolName: position?.protocol ?? args.protocolAddress,
            error: 'Withdrawal failed',
          },
        });
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (positionLoading) {
    return <Skeleton className="h-48 w-96" />;
  }

  if (positionError) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Couldn&apos;t load positions</h3>
          <p className="text-gray-600 dark:text-gray-400">{positionError}</p>
        </div>
      </Card>
    );
  }

  if (!position) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">
            {positions.length ? 'Pick a Lending Position' : 'No Lending Positions Found'}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Withdrawals are managed in your Portfolio. Pick a position to view it, then continue in
            Portfolio to withdraw.
          </div>
          <Button variant="brand" className="w-full" onClick={handleViewPortfolio} disabled={isNavigating}>
            {isNavigating ? 'Opening Portfolio…' : 'View Portfolio'}
          </Button>
          {positions.length ? (
            <div className="flex flex-col gap-2">
              {positions.map((p, idx) => (
                <Button
                  key={`${p.protocol}-${p.token.id}-${idx}`}
                  variant="outline"
                  className="justify-between"
                  onClick={() => {
                    setPosition(p);
                    setAmount(String(args.amount ?? p.amount));
                  }}
                >
                  <span>
                    {p.token.symbol} on {p.protocol}
                  </span>
                  <span className="text-xs text-neutral-500">{p.amount.toFixed(4)}</span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have any lending positions to withdraw from.
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <div className="flex flex-col gap-4 w-96 max-w-full">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Withdraw from {position.protocol}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Withdrawals are managed in your Portfolio. Continue there to withdraw from this
            position.
          </p>
        </div>

        <Button variant="brand" className="w-full" onClick={handleViewPortfolio} disabled={isNavigating}>
          {isNavigating ? 'Opening Portfolio…' : 'View Portfolio'}
        </Button>

        <div className="w-full">
          <TokenInput
            token={position.token}
            label="Amount to Withdraw"
            amount={amount}
            onChange={setAmount}
            address={wallet?.address}
            useBalanceFromAmount
            availableBalance={position.amount}
          />
          {Number.isFinite(position.amount) && (
            <div className="text-xs text-right mt-1 text-neutral-500">
              Available: {Number(position.amount).toFixed(6)} {position.token.symbol}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {walletMismatch && (
            <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              Your connected wallet doesn&apos;t match the wallet for this position. Next: connect
              the wallet that owns the position, then try again.
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={handleWithdraw} disabled={isWithdrawing || !amount || walletMismatch}>
            {isWithdrawing ? 'Withdrawing…' : 'Withdraw here instead'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const WithdrawTool: React.FC<{ tool: ToolInvocation; prevToolAgent?: string }> = ({
  tool,
  prevToolAgent,
}) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Preparing withdrawal…"
      result={{
        heading: (result: WithdrawResultType) =>
          result.body?.status === 'complete' ? 'Withdraw Complete' : 'Withdraw',
        body: (result: WithdrawResultType) => {
          if (result.body?.status === 'complete' && result.body.tokenSymbol) {
            return (
              <div className="flex justify-center w-full">
                <div className="w-full ">
                  <WithdrawResult
                    amount={result.body.amount}
                    tokenSymbol={result.body.tokenSymbol}
                    yieldEarned={result.body.yieldEarned}
                  />
                </div>
              </div>
            );
          }

          const args = tool.args as WithdrawArgumentsType;
          return <WithdrawCall toolCallId={tool.toolCallId} args={args} />;
        },
      }}
      call={{
        heading: 'Withdraw',
        body: (toolCallId: string, args: WithdrawArgumentsType) => (
          <WithdrawCall toolCallId={toolCallId} args={args} />
        ),
      }}
      defaultOpen
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default WithdrawTool;
