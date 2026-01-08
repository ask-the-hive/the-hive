const normalizeSymbol = (symbol: string) =>
  String(symbol || '')
    .trim()
    .toUpperCase();

export const SOLANA_LENDING_STABLECOIN_SYMBOLS = [
  'USDC',
  'USDT',
  'USDG',
  'USDS',
  'USDY',
  'EURC',
  'FDUSD',
  'PYUSD',
] as const;

export type SolanaLendingStablecoinSymbol = (typeof SOLANA_LENDING_STABLECOIN_SYMBOLS)[number];

const solanaLendingStablecoinSet = new Set<string>(SOLANA_LENDING_STABLECOIN_SYMBOLS);

export function isSupportedSolanaLendingStablecoin(symbol: string): boolean {
  return solanaLendingStablecoinSet.has(normalizeSymbol(symbol));
}

export const STABLECOIN_SYMBOLS = SOLANA_LENDING_STABLECOIN_SYMBOLS;
export type StablecoinSymbol = SolanaLendingStablecoinSymbol;
export function isStablecoinSymbol(symbol: string): boolean {
  return isSupportedSolanaLendingStablecoin(symbol);
}

export const SOLANA_STAKING_LST_SYMBOLS = [
  'JITOSOL',
  'MSOL',
  'BSOL',
  'DSOL',
  'BNSOL',
  'BBSOL',
  'HSOL',
  'JUPSOL',
  'INF',
  'STSOL',
  'JSOL',
] as const;

export type SolanaStakingLstSymbol = (typeof SOLANA_STAKING_LST_SYMBOLS)[number];

const solanaStakingLstSet = new Set<string>(SOLANA_STAKING_LST_SYMBOLS);

export function isSupportedSolanaStakingLst(symbol: string): boolean {
  return solanaStakingLstSet.has(normalizeSymbol(symbol));
}
