import { coinGeckoRequest } from './helpers';

export interface CoinGeckoPlatformDetail {
  decimal_place: number | null;
  contract_address: string;
}

export interface CoinGeckoPrice {
  aed: number;
  ars: number;
  aud: number;
  bch: number;
  bdt: number;
  bhd: number;
  bmd: number;
  bnb: number;
  brl: number;
  btc: number;
  cad: number;
  chf: number;
  clp: number;
  cny: number;
  czk: number;
  dkk: number;
  dot: number;
  eos: number;
  eth: number;
  eur: number;
  gbp: number;
  gel: number;
  hkd: number;
  huf: number;
  idr: number;
  ils: number;
  inr: number;
  jpy: number;
  krw: number;
  kwd: number;
  lkr: number;
  ltc: number;
  mmk: number;
  mxn: number;
  myr: number;
  ngn: number;
  nok: number;
  nzd: number;
  php: number;
  pkr: number;
  pln: number;
  rub: number;
  sar: number;
  sek: number;
  sgd: number;
  sol: number;
  thb: number;
  try: number;
  twd: number;
  uah: number;
  usd: number;
  vef: number;
  vnd: number;
  xag: number;
  xau: number;
  xdr: number;
  xlm: number;
  xrp: number;
  yfi: number;
  zar: number;
  bits: number;
  link: number;
  sats: number;
}

export interface CoinGeckoMarketData {
  current_price: CoinGeckoPrice;
  total_value_locked: number | null;
  mcap_to_tvl_ratio: number | null;
  fdv_to_tvl_ratio: number | null;
  roi: number | null;
  ath: CoinGeckoPrice;
  ath_change_percentage: CoinGeckoPrice;
  ath_date: Record<string, string>;
  atl: CoinGeckoPrice;
  atl_change_percentage: CoinGeckoPrice;
  atl_date: Record<string, string>;
  market_cap: CoinGeckoPrice;
  market_cap_rank: number;
  fully_diluted_valuation: CoinGeckoPrice;
  market_cap_fdv_ratio: number;
  total_volume: CoinGeckoPrice;
  high_24h: CoinGeckoPrice;
  low_24h: CoinGeckoPrice;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_14d: number;
  price_change_percentage_30d: number;
  price_change_percentage_60d: number;
  price_change_percentage_200d: number;
  price_change_percentage_1y: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  price_change_24h_in_currency: CoinGeckoPrice;
  price_change_percentage_1h_in_currency: CoinGeckoPrice;
  price_change_percentage_24h_in_currency: CoinGeckoPrice;
  price_change_percentage_7d_in_currency: CoinGeckoPrice;
  price_change_percentage_14d_in_currency: CoinGeckoPrice;
  price_change_percentage_30d_in_currency: CoinGeckoPrice;
  price_change_percentage_60d_in_currency: CoinGeckoPrice;
  price_change_percentage_200d_in_currency: CoinGeckoPrice;
  price_change_percentage_1y_in_currency: CoinGeckoPrice;
  market_cap_change_24h_in_currency: CoinGeckoPrice;
  market_cap_change_percentage_24h_in_currency: CoinGeckoPrice;
  total_supply: number;
  max_supply: number | null;
  circulating_supply: number;
  last_updated: string;
}

export interface CoinGeckoImage {
  thumb: string;
  small: string;
  large: string;
}

export interface CoinGeckoLinks {
  homepage: string[];
  whitepaper: string;
  blockchain_site: string[];
  official_forum_url: string[];
  chat_url: string[];
  announcement_url: string[];
  snapshot_url: string | null;
  twitter_screen_name: string;
  facebook_username: string;
  bitcointalk_thread_identifier: string | null;
  telegram_channel_identifier: string;
  subreddit_url: string;
  repos_url: {
    github: string[];
    bitbucket: string[];
  };
}

export interface CoinGeckoCommunityData {
  facebook_likes: number | null;
  reddit_average_posts_48h: number;
  reddit_average_comments_48h: number;
  reddit_subscribers: number;
  reddit_accounts_active_48h: number;
  telegram_channel_user_count: number | null;
}

export interface CoinGeckoDeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  total_issues: number;
  closed_issues: number;
  pull_requests_merged: number;
  pull_request_contributors: number;
  code_additions_deletions_4_weeks: {
    additions: number;
    deletions: number;
  };
  commit_count_4_weeks: number;
  last_4_weeks_commit_activity_series: number[];
}

export interface CoinGeckoTicker {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
    has_trading_incentive: boolean;
  };
  last: number;
  volume: number;
  converted_last: {
    btc: number;
    eth: number;
    usd: number;
  };
  converted_volume: {
    btc: number;
    eth: number;
    usd: number;
  };
  trust_score: string;
  bid_ask_spread_percentage: number;
  timestamp: string;
  last_traded_at: string;
  last_fetch_at: string;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string;
  token_info_url: string | null;
  coin_id: string;
  target_coin_id: string;
}

export interface CoinGeckoTokenMetadata {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string;
  platforms: Record<string, string>;
  detail_platforms: Record<string, CoinGeckoPlatformDetail>;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string;
  additional_notices: string[];
  localization: Record<string, string>;
  description: Record<string, string>;
  links: CoinGeckoLinks;
  image: CoinGeckoImage;
  country_origin: string;
  genesis_date: string | null;
  contract_address: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  market_data: CoinGeckoMarketData;
  community_data: CoinGeckoCommunityData;
  developer_data: CoinGeckoDeveloperData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status_updates: any[];
  last_updated: string;
  tickers: CoinGeckoTicker[];
}

type CoinSearchResult = { id: string; symbol: string; name: string };
/**
 * Fetch token metadata from CoinGecko by symbol.
 * @param symbol - Token symbol (case-insensitive)
 * @returns Promise<unknown | null> - Token metadata object or null if not found
 */
export async function getTokenMetadataBySymbol(
  symbol: string,
): Promise<CoinGeckoTokenMetadata | null> {
  // Step 1: Search for the symbol
  const searchUrl = `https://api.coingecko.com/api/v3/search?query=${symbol}`;
  const searchResponse = await coinGeckoRequest(searchUrl);
  const coin = (searchResponse.data.coins as CoinSearchResult[]).find(
    (c) => c.symbol.toUpperCase() === symbol.toUpperCase(),
  );

  if (!coin) return null;

  // Step 2: Fetch metadata by CoinGecko ID
  const metaUrl = `https://api.coingecko.com/api/v3/coins/${coin.id}`;
  const metaResponse = await coinGeckoRequest(metaUrl);

  return metaResponse.data;
}
