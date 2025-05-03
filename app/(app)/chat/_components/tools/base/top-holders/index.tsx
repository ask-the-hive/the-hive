import React, { useState } from 'react'
import Image from 'next/image';
import { Button } from '@/components/ui';
import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { TokenHolder } from '@/services/moralis';

// Known addresses with their logos
const KNOWN_ADDRESSES: Record<string, { name: string, logo: string }> = {
    "0x0000000000000000000000000000000000000000": {
        name: "Burn Address",
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"
    },
    "0x000000000000000000000000000000000000dead": {
        name: "Burn Address: 0x00...dEaD",
        logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"
    },
    "0x4200000000000000000000000000000000000006": {
        name: "Base: Bridge",
        logo: "/exchanges/base.png"
    },
    "0x420000000000000000000000000000000000000f": {
        name: "Base: L2 Standard Bridge",
        logo: "/exchanges/base.png"
    },
    "0x4200000000000000000000000000000000000010": {
        name: "Base: Portal",
        logo: "/exchanges/base.png"
    },
    "0x4200000000000000000000000000000000000015": {
        name: "Base: Sequencer Fee Vault",
        logo: "/exchanges/base.png"
    },
    "0x4200000000000000000000000000000000000016": {
        name: "Base: Base Fee Vault",
        logo: "/exchanges/base.png"
    },
    "0x3154cf16ccdb4c6d922629664174b904d80f2c35": {
        name: "Base: Coinbase",
        logo: "/exchanges/coinbase.png"
    }
};

// Platform name to logo mapping
const PLATFORM_LOGOS: Record<string, string> = {
    "base": "/exchanges/base.png",
    "uniswap": "/exchanges/uniswap.png",
    "coinbase": "/exchanges/coinbase.png",
    "binance": "/exchanges/binance.png",
    "bybit": "/exchanges/bybit.png",
    "bitget": "/exchanges/bitget.png",
    "kraken": "/exchanges/kraken.png",
    "gemini": "/exchanges/gemini.png",
    "bitstamp": "/exchanges/bitstamp.png",
    "bitfinex": "/exchanges/bitfinex.png",
    "ftx": "/exchanges/ftx.png",
    "deribit": "/exchanges/deribit.png",
    "bitmex": "/exchanges/bitmex.png",
    "bittrex": "/exchanges/bittrex.png",
    "poloniex": "/exchanges/poloniex.png",
    "liquid": "/exchanges/liquid.png",
    "lbank": "/exchanges/lbank.png",
    "ascendex": "/exchanges/ascendex.png",
    "bibox": "/exchanges/bibox.png",
    "bitmart": "/exchanges/bitmart.png",
    "bkex": "/exchanges/bkex.png",
    "btcturk": "/exchanges/btcturk.png",
    "cex": "/exchanges/cex.png",
    "coinex": "/exchanges/coinex.png",
    "coinflex": "/exchanges/coinflex.png",
    "coinone": "/exchanges/coinone.png",
    "digifinex": "/exchanges/digifinex.png",
    "hotbit": "/exchanges/hotbit.png",
    "indodax": "/exchanges/indodax.png",
    "latoken": "/exchanges/latoken.png",
    "luno": "/exchanges/luno.png",
    "okcoin": "/exchanges/okcoin.png",
    "p2pb2b": "/exchanges/p2pb2b.png",
    "paribu": "/exchanges/paribu.png",
    "probit": "/exchanges/probit.png",
    "upbit": "/exchanges/upbit.png",
    "wazirx": "/exchanges/wazirx.png",
    "whitebit": "/exchanges/whitebit.png",
    "woo": "/exchanges/woo.png",
    "zb": "/exchanges/zb.png",
    "zbg": "/exchanges/zbg.png",
    "zt": "/exchanges/zt.png",
    "aerodrome": "/exchanges/aerodrome.png",
    "baseswap": "/exchanges/baseswap.png",
    "alienbase": "/exchanges/alienbase.png",
    "swapbased": "/exchanges/swapbased.png",
    "maverick": "/exchanges/maverick.png",
    "sushiswap": "/exchanges/sushiswap.png",
    "pancakeswap": "/exchanges/pancakeswap.png",
    "balancer": "/exchanges/balancer.png",
    "curve": "/exchanges/curve.png",
    "dodo": "/exchanges/dodo.png"
};

// Helper function to get the appropriate logo for a label
const getLogoForLabel = (label: string): string => {
    // Check if the label contains any of the platform names
    const lowerLabel = label.toLowerCase();
    for (const [platform, logo] of Object.entries(PLATFORM_LOGOS)) {
        if (lowerLabel.includes(platform)) {
            return logo;
        }
    }
    // Default to generic logo if no match
    return "/exchanges/generic.png";
};

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const TopHolders: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Top Holders...`}
            result={{
                heading: (result: any) => result.body 
                    ? `Fetched Top Holders`
                    : `Failed to fetch top holders`,
                body: (result: any) => result.body 
                    ? <TopHoldersDisplay body={result.body} />
                    : result.message || "No top holders found"
            }}
            call={{
                heading: "Get Top Holders",
                body: (toolCallId: string, args: any) => (
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">Token:</span>
                            <span>{args.search}</span>
                        </div>
                    </div>
                )
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
        />
    )
}

interface TopHoldersDisplayProps {
    body: {
        topHolders: TokenHolder[];
        totalPercentage: number;
    }
}

const TopHoldersDisplay: React.FC<TopHoldersDisplayProps> = ({ body }) => {
    const [showAll, setShowAll] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <p className="text-md">
                {body.totalPercentage.toFixed(2)}% of the total supply is owned by the top 20 holders
            </p>
            <div className="flex flex-col gap-2">
                {body.topHolders.slice(0, showAll ? body.topHolders.length : 5).map((holder, index) => (
                    <TopHolderCard
                        key={holder.address} 
                        holder={holder}
                        index={index}
                    />
                ))}
            </div>
            <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
            >
                {showAll ? "Show Less" : "Show All"}
            </Button>
        </div>
    )
}

interface TopHolderCardProps {
    holder: TokenHolder;
    index: number;
}

const TopHolderCard: React.FC<TopHolderCardProps> = ({ holder, index }) => {
    // Check if this is a known address
    const knownAddress = KNOWN_ADDRESSES[holder.address.toLowerCase()];
    
    // If not a known address but has a label, create a dynamic entry
    const displayInfo = knownAddress || (holder.label ? {
        name: holder.label,
        logo: getLogoForLabel(holder.label)
    } : null);

    return (
        <div className="flex flex-row items-center gap-2 p-2 border rounded-md">
            <p className="text-sm text-muted-foreground">
                {index + 1})
            </p>
            <div className="flex flex-col">
                {displayInfo ? (
                    <div className="flex flex-row items-center gap-2">
                        <Image
                            src={displayInfo.logo}
                            alt={displayInfo.name}
                            width={16}
                            height={16}
                        />
                        <p className="text-sm font-bold">
                            {displayInfo.name}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm font-bold break-all">
                        {holder.address}
                    </p>
                )}
                <p className="text-xs">
                    {parseFloat(holder.amountDecimal).toLocaleString()} ({holder.percentage.toFixed(2)}%)
                </p>
            </div>
        </div>
    )
}

export default TopHolders; 