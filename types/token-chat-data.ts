import type { TokenOverview } from "@/services/birdeye/types";
import type { ChainType } from "@/app/_contexts/chain-context";

export type TokenChatData = Pick<TokenOverview, 
  'address' | 
  'name' | 
  'symbol' | 
  'decimals' | 
  'extensions' |
  'logoURI' |
  'supply' |
  'circulatingSupply'
> & {
  chain?: ChainType;
};