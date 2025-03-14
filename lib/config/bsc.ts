// BSC token addresses
export const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c".toLowerCase();

// BNB/WBNB metadata
export const BNB_METADATA = {
    id: "BNB",
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18,
    tags: [],
    logoURI: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {}
};

export const WBNB_METADATA = {
    ...BNB_METADATA,
    id: WBNB_ADDRESS,
    name: "Wrapped BNB",
    symbol: "WBNB"
}; 