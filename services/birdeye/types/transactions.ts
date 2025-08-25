export interface TransactionTokenInfo {
  symbol: string;
  decimals: number;
  address: string;
  amount: number;
  uiAmount: number;
  price: number;
  nearestPrice: number;
  changeAmount: number;
  uiChangeAmount: number;
  isScaledUiToken: boolean;
  multiplier: number | null;
}

export interface Transaction {
  quote: TransactionTokenInfo;
  base: TransactionTokenInfo;
  basePrice: number;
  quotePrice: number;
  txHash: string;
  source: string;
  blockUnixTime: number;
  txType: string;
  owner: string;
  side: 'buy' | 'sell';
  alias: string | null;
  pricePair: number;
  from: TransactionTokenInfo;
  to: TransactionTokenInfo;
  tokenPrice: number;
  poolId: string;
}

export interface TransactionsResponse {
  items: Transaction[];
  hasNext: boolean;
}
