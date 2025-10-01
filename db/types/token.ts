export interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  tags: string[];
  logoURI: string;
  freezeAuthority: string | null;
  mintAuthority: string | null;
  permanentDelegate: string | null;
  extensions: {
    coingeckoId?: string;
  };
  contractAddress?: string;
}
