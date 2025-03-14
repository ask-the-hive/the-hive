import { queryBirdeye } from "./base";
import { TradesResponse, TxType } from "./types/trades";
import { ChainType } from "@/app/_contexts/chain-context";

interface SeekTradesByTimeParams {
    address: string;
    offset?: number;
    limit?: number;
    txType?: TxType;
    beforeTime?: number;
    afterTime?: number;
    chain?: ChainType;
}

export const seekTradesByTime = async ({
    address,
    offset = 0,
    limit = 100,
    txType = 'swap',
    beforeTime = 0,
    afterTime = 0,
    chain = 'solana'
}: SeekTradesByTimeParams): Promise<TradesResponse> => {
    return queryBirdeye<TradesResponse>(
        'trader/txs/seek_by_time',
        {
            address,
            offset,
            limit,
            tx_type: txType,
            before_time: beforeTime,
            after_time: afterTime
        },
        chain
    );
} 