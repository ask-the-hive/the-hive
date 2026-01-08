import { NextRequest, NextResponse } from 'next/server';

import { getTokenMetadata } from '@/services/birdeye';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

const SOL_METADATA = {
  name: 'Solana',
  symbol: 'SOL',
  decimals: 9,
  extensions: {},
  logo_uri:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
};

const SOL_TOKEN_ADDRESSES = [
  'so11111111111111111111111111111111111111112',
  'so11111111111111111111111111111111111111111',
];

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const normalizedAddress = address.toLowerCase();

    const searchParams = request.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'solana';
    const chain =
      chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base'
        ? (chainParam as ChainType)
        : 'solana';
    try {
      if (
        chain === 'solana' &&
        (SOL_TOKEN_ADDRESSES.includes(normalizedAddress) || normalizedAddress === 'sol')
      ) {
        return NextResponse.json({
          ...SOL_METADATA,
          address: 'So11111111111111111111111111111111111111112',
        });
      }

      const metadata = await getTokenMetadata(address, chain);

      if (chain === 'solana' && metadata.symbol?.toUpperCase() === 'SOL') {
        return NextResponse.json({
          ...SOL_METADATA,
          address: 'So11111111111111111111111111111111111111112',
        });
      }

      return NextResponse.json(metadata);
    } catch (error) {
      console.error(`API route: Error fetching metadata for ${address}:`, error);

      if (
        chain === 'solana' &&
        (SOL_TOKEN_ADDRESSES.includes(normalizedAddress) || normalizedAddress === 'sol')
      ) {
        return NextResponse.json({
          ...SOL_METADATA,
          address: 'So11111111111111111111111111111111111111112',
        });
      }

      return NextResponse.json(
        {
          address,
          name: 'Unknown Token',
          symbol: 'UNKNOWN',
          decimals: 18,
          extensions: {},
          logo_uri: 'https://www.birdeye.so/images/unknown-token-icon.svg',
        },
        { status: 200 },
      );
    }
  },
);
