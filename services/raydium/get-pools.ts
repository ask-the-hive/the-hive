import { raydiumApiClient } from './client';
import { ApiV3PoolInfoItem } from '@raydium-io/raydium-sdk-v2';

export const getRaydiumPoolsByMint = async (mint: string): Promise<ApiV3PoolInfoItem[]> => {
  const raydiumClient = await raydiumApiClient();
  const { data } = await raydiumClient.api.fetchPoolByMints({
    mint1: mint,
  });
  return data;
};

export const getRaydiumPoolById = async (id: string): Promise<ApiV3PoolInfoItem> => {
  const raydiumClient = await raydiumApiClient();
  const data = await raydiumClient.api.fetchPoolById({
    ids: id,
  });

  return data[0];
};
