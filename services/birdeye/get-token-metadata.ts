import { queryBirdeye } from './base';
import { ChainType } from '@/app/_contexts/chain-context';

import { TokenMetadata } from './types';
import * as Sentry from '@sentry/nextjs';

export const getTokenMetadata = async (
  address: string,
  chain: ChainType = 'solana',
): Promise<TokenMetadata> => {
  try {
    const metadata = await queryBirdeye<TokenMetadata>(
      'defi/v3/token/meta-data/single',
      { address },
      chain,
    );

    return metadata;
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error fetching metadata for token ${address} on ${chain}:`, error);
    // Return a minimal metadata object
    return {
      address,
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
      extensions: {},
      logo_uri: '',
    };
  }
};
