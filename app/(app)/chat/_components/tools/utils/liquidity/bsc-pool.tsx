import React from "react";

import { BscPoolStats } from "./bsc-pool-stats";

import type { MoralisPair } from "@/services/moralis/get-token-pairs";

interface Props {
    pair: MoralisPair;
}

const BscPool: React.FC<Props> = ({ pair }) => {
    // Helper function to safely format numbers
    const formatNumber = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "0";
        return value.toLocaleString();
    };

    // Helper function to safely format percentages
    const formatPercentage = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "0.00";
        return value.toFixed(2);
    };

    return (
        <BscPoolStats pair={pair}>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2 w-full justify-between">
                    <div className="flex flex-col gap-2 w-full">
                        <p className="text-sm font-medium">Price</p>
                        <p className="text-sm font-medium">${formatNumber(pair.usd_price)}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <p className="text-sm font-medium">24h Change</p>
                        <p className={`text-sm font-medium ${(pair.usd_price_24hr_percent_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercentage(pair.usd_price_24hr_percent_change)}%
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <p className="text-sm font-medium">Volume 24h</p>
                        <p className="text-sm font-medium">${formatNumber(pair.volume_24h_usd)}</p>
                    </div>
                </div>
            </div>
        </BscPoolStats>
    )
}

export default BscPool; 