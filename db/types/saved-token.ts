export type SavedToken = {
    id: string;
    userId: string;
    name: string;
    symbol: string;
    logoURI: string;
    chain: 'solana' | 'bsc';
}