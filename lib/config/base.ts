// Base token addresses
export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006".toLowerCase();

// ETH/WETH metadata
export const ETH_METADATA = {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    tags: [],
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {}
};

export const WETH_METADATA = {
    ...ETH_METADATA,
    id: WETH_ADDRESS,
    name: "Wrapped Ethereum",
    symbol: "WETH"
}; 