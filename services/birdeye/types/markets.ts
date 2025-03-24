export enum MarketSource {
    // Solana markets
    Raydium = "Raydium",
    RaydiumClamm = "Raydium Clamm",
    RaydiumCp = "Raydium Cp",
    MeteoraDlmm = "Meteora Dlmm",
    Meteora = "Meteora",
    Orca = "Orca",
    Phoenix = "Phoenix",
    
    // BSC markets
    PancakeSwap = "PancakeSwap",
    Uniswap = "Uniswap",
    BiSwap = "BiSwap",
    MDEX = "MDEX",
    ApeSwap = "ApeSwap",
    BabySwap = "BabySwap",
    BakerySwap = "BakerySwap",
    BSWSwap = "BSWSwap",
    ThenaFusion = "Thena Fusion",
    ThenaAlgebra = "Thena Algebra"
}

export interface TokenInfo {
    address: string;
    decimals: number;
    symbol: string;
    icon: string;
}

export interface MarketItem {
    address: string;
    base: TokenInfo;
    quote: TokenInfo;
    createdAt: string;
    liquidity: number;
    name: string;
    price: number;
    source: MarketSource;
    volume24h: number;
    trade24h: number;
    trade24hChangePercent: number | null;
    uniqueWallet24h: number;
    uniqueWallet24hChangePercent: number | null;
}

export interface MarketsResponseData {
    items: MarketItem[];
    total: number;
}
