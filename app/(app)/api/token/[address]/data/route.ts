import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/db/services';
import { getTokenOverview } from '@/services/birdeye';
import type { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const searchParams = req.nextUrl.searchParams;
    const chainParam = searchParams.get('chain') || 'solana';
    const chain =
      chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base'
        ? (chainParam as ChainType)
        : 'solana';

    // Always fetch latest data from Birdeye to get complete extensions (including Twitter)
    const tokenMetadata = await getTokenOverview(address, chain);

    if (!tokenMetadata) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Check if we have additional data in DB
    const dbToken = await getToken(address);

    // Return token data with Birdeye extensions and any additional DB data
    return NextResponse.json({
      id: tokenMetadata.address,
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
      decimals: tokenMetadata.decimals,
      logoURI: tokenMetadata.logoURI,
      extensions: tokenMetadata.extensions, // Always use Birdeye extensions for complete social data
      tags: dbToken?.tags || [],
      freezeAuthority: dbToken?.freezeAuthority || null,
      mintAuthority: dbToken?.mintAuthority || null,
      permanentDelegate: dbToken?.permanentDelegate || null,
      overview: tokenMetadata,
    });
  },
);
