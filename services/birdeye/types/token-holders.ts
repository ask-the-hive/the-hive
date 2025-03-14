export interface TokenHolder {
    amount: string;
    decimals: number;
    mint: string;
    owner: string;
    token_account: string;
    ui_amount: number;
    percentage?: number; // Optional percentage field for BSC tokens
}

export interface TokenHoldersResponse {
    items: TokenHolder[];
} 