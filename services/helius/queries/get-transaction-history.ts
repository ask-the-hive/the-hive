import { EnrichedTransaction, TransactionType, Source } from 'helius-sdk';

const JUPITER_LEND_PROGRAMS = new Set([
  'jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9',
  'jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC', // helper program seen in logs
]);

export const getTransactionHistory = async (address: string): Promise<EnrichedTransaction[]> => {
  const response = await fetch(
    `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${process.env.HELIUS_API_KEY}`,
    {
      method: 'GET',
      headers: {},
    },
  );
  const data = (await response.json()) as EnrichedTransaction[];

  // Post-process to label Jupiter Lend txns that come back as UNKNOWN
  const mapped = (data || []).map((tx) => {
    const isJupiterLend =
      tx?.instructions?.some((ix: any) => JUPITER_LEND_PROGRAMS.has(ix?.programId)) || false;
    const isKamino =
      tx?.source?.toUpperCase?.().includes('KAMINO') ||
      String(tx?.type).toUpperCase() === 'REFRESH_OBLIGATION';

    if (!isJupiterLend && !isKamino) return tx;

    // Keep type inside Helius enums; treat unlabeled Jupiter-lend as transfer-like
    const patchedType: TransactionType =
      tx.type && tx.type !== 'UNKNOWN' ? tx.type : TransactionType.TRANSFER;
    const patchedSource: Source = isJupiterLend
      ? Source.JUPITER
      : isKamino
        ? Source.UNKNOWN
        : tx.source && tx.source !== 'UNKNOWN'
          ? (tx.source as Source)
          : Source.UNKNOWN;

    return {
      ...tx,
      type: patchedType,
      source: patchedSource,
    };
  });

  return mapped as EnrichedTransaction[];
};
