import type { EnrichedTransaction } from "helius-sdk";

// Convert BSC transactions to the same format as Helius transactions
export const getBscTransactionHistory = async (address: string): Promise<EnrichedTransaction[]> => {
    try {
        const apiKey = process.env.BSCSCAN_API_KEY || '';
        const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== '1') {
            console.error('BSCScan API error:', data.message);
            return [];
        }
        
        // Convert BSCScan transactions to Helius format
        return data.result.slice(0, 20).map((tx: any) => ({
            signature: tx.hash,
            type: tx.functionName ? 'CONTRACT_CALL' : 'TRANSFER',
            source: 'BSC_TRANSACTION',
            fee: parseInt(tx.gasUsed) * parseInt(tx.gasPrice) / 1e18,
            timestamp: parseInt(tx.timeStamp) * 1000,
            tokenTransfers: [
                {
                    fromUserAccount: tx.from,
                    toUserAccount: tx.to,
                    tokenAmount: parseInt(tx.value) / 1e18,
                    mint: '0x0000000000000000000000000000000000000000', // BNB
                    symbol: 'BNB',
                }
            ],
            nativeTransfers: [
                {
                    fromUserAccount: tx.from,
                    toUserAccount: tx.to,
                    amount: parseInt(tx.value) / 1e18,
                }
            ]
        }));
    } catch (error) {
        console.error('Error fetching BSC transactions:', error);
        return [];
    }
}; 