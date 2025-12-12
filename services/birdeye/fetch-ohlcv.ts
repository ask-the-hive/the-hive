import { queryBirdeye } from './base';
import { OHLCVResponse, OHLCVTimeframe } from './types/ohlcv';
import { ChainType } from '@/app/_contexts/chain-context';

interface FetchOHLCVParams {
  address: string;
  timeframe?: OHLCVTimeframe;
  timeFrom: number;
  timeTo: number;
  chain?: ChainType;
}

export const fetchOHLCV = async ({
  address,
  timeframe = OHLCVTimeframe.FifteenMinutes,
  timeFrom,
  timeTo,
  chain = 'solana',
}: FetchOHLCVParams): Promise<OHLCVResponse> => {
  return queryBirdeye<OHLCVResponse>(
    'defi/ohlcv',
    {
      address,
      type: timeframe,
      time_from: timeFrom,
      time_to: timeTo,
    },
    chain,
  );
};
