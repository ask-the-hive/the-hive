import { getTokenHolders } from "@/services/birdeye";
import { getStreamsByMint } from "@/services/streamflow";
import { Connection, PublicKey } from "@solana/web3.js";

import { knownAddresses } from "@/lib/known-addresses";

import type { TokenPageTopHoldersResultBodyType, TokenPageTopHoldersArgumentsType } from "./types";
import type { SolanaActionResult } from "../../../solana/actions/solana-action";
import type { TokenChatData } from "@/types";
import { AddressType, KnownAddress } from "@/types/known-address";

export async function getTokenPageTopHolders(token: TokenChatData, _: TokenPageTopHoldersArgumentsType): Promise<SolanaActionResult<TokenPageTopHoldersResultBodyType>> {
    try {
        const numHolders = 50;
        
        // Get token holders from Birdeye and streamflow vaults
        const [tokenHoldersResponse, streamflowVaults] = await Promise.all([
            getTokenHolders({
                address: token.address,
                offset: 0,
                limit: numHolders,
                chain: 'solana'
            }),
            getStreamsByMint(token.address)
        ]);

        if (!tokenHoldersResponse.items || tokenHoldersResponse.items.length === 0) {
            return {
                message: `Could not find holder data for this Solana token.`,
            };
        }

        // Get total supply to calculate percentages
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
        const mintInfo = await connection.getTokenSupply(new PublicKey(token.address));
        const totalSupply = Number(BigInt(mintInfo.value.amount) / BigInt(Math.pow(10, mintInfo.value.decimals)));

        // Create known addresses map with streamflow vaults
        const knownAddressesWithStreamflow = {
            ...knownAddresses,
            ...streamflowVaults.reduce((acc, account) => {
                acc[account.account.escrowTokens] = {
                    name: "Streamflow Vault",
                    logo: "/vesting/streamflow.png",
                    type: AddressType.VestingVault
                }
                return acc;
            }, {} as Record<string, KnownAddress>)
        }

        // Map holders to a consistent format and calculate percentages
        const holdersWithAnnotations = tokenHoldersResponse.items.map((holder) => {
            const holderAddress = holder.owner;
            const knownAddress = knownAddressesWithStreamflow[holderAddress];
            const percentOfSupply = holder.ui_amount / totalSupply;
            
            return {
                owner: knownAddress?.name || holderAddress,
                type: knownAddress?.type || AddressType.EOA,
                percentOfSupply: percentOfSupply
            };
        });

        // Separate holders by type
        const { eoa, vesting, exchange } = holdersWithAnnotations.reduce((acc, holder) => {
            if (holder.type === AddressType.EOA) {
                acc.eoa.push({
                    name: holder.owner,
                    type: AddressType.EOA,
                    percentOfSupply: holder.percentOfSupply
                });
            } else if (holder.type === AddressType.VestingVault) {
                acc.vesting.push({
                    name: holder.owner,
                    type: AddressType.VestingVault,
                    percentOfSupply: holder.percentOfSupply
                });
            } else if (holder.type === AddressType.CentralizedExchange || holder.type === AddressType.DecentralizedExchange) {
                acc.exchange.push({
                    name: holder.owner,
                    type: AddressType.CentralizedExchange,
                    percentOfSupply: holder.percentOfSupply
                });
            }
            return acc;
        }, {
            eoa: [],
            vesting: [],
            exchange: []
        } as Record<string, { name: string, type: AddressType, percentOfSupply: number }[]>);

        // Calculate basic holder percentages
        const top10HoldersPercent = eoa.slice(0, 10).reduce((acc, curr) => acc + curr.percentOfSupply, 0);
        const top20HoldersPercent = eoa.slice(0, 20).reduce((acc, curr) => acc + curr.percentOfSupply, 0);
        const exchangeHoldersPercent = exchange.reduce((acc, curr) => acc + curr.percentOfSupply, 0);
        const vestedHoldersPercent = vesting.reduce((acc, curr) => acc + curr.percentOfSupply, 0);

        // Calculate concentration metrics
        const top5HoldersPercent = eoa.slice(0, 5).reduce((acc, curr) => acc + curr.percentOfSupply, 0);
        const largestHolder = eoa[0]?.percentOfSupply || 0;
        
        // Calculate distribution patterns
        const totalAnalyzedPercent = top20HoldersPercent + exchangeHoldersPercent + vestedHoldersPercent;
        const remainingSupplyPercent = Math.max(0, 1 - totalAnalyzedPercent);
        
        // Calculate average holdings
        const avgTop10Holding = top10HoldersPercent / Math.min(10, eoa.length);
        const avgExchangeHolding = exchange.length > 0 ? exchangeHoldersPercent / exchange.length : 0;

        // Generate distribution assessment
        const concentrationLevel = top10HoldersPercent > 0.5 ? "Highly Concentrated" : 
                                 top10HoldersPercent > 0.3 ? "Moderately Concentrated" : 
                                 "Well Distributed";

        const exchangePresence = exchangeHoldersPercent > 0.2 ? "Significant" :
                               exchangeHoldersPercent > 0.1 ? "Moderate" :
                               "Limited";

        return {
            message: `Analysis of Solana token distribution patterns:

1. Concentration Metrics:
   - The largest single holder controls ${(largestHolder * 100).toFixed(2)}% of the supply
   - Top 5 holders control ${(top5HoldersPercent * 100).toFixed(2)}%
   - Top 10 holders control ${(top10HoldersPercent * 100).toFixed(2)}%
   - Top 20 holders control ${(top20HoldersPercent * 100).toFixed(2)}%

2. Exchange & Vesting Distribution:
   - ${(exchangeHoldersPercent * 100).toFixed(2)}% is held across ${exchange.length} exchange addresses
   - ${(vestedHoldersPercent * 100).toFixed(2)}% is locked in vesting contracts
   - Average exchange holding is ${(avgExchangeHolding * 100).toFixed(2)}%

3. Distribution Assessment:
   - Token ownership appears ${concentrationLevel}
   - Exchange presence is ${exchangePresence}
   - ${(remainingSupplyPercent * 100).toFixed(2)}% is distributed among smaller holders

4. Key Metrics:
   - Average top 10 holder owns ${(avgTop10Holding * 100).toFixed(2)}%
   - Ratio of exchange to vested tokens: ${(exchangeHoldersPercent / (vestedHoldersPercent || 1)).toFixed(2)}x
   
Discuss only the notable metrics unless asked for further details.`,
            body: {
                top5HoldersPercent,
                top10HoldersPercent,
                top20HoldersPercent,
                exchangeHoldersPercent,
                vestedHoldersPercent,
                largestHolder,
                remainingSupplyPercent,
                avgTop10Holding,
                avgExchangeHolding,
                concentrationLevel,
                exchangePresence,
                numExchanges: exchange.length,
                numVestingContracts: vesting.length
            }
        };
    } catch (error) {
        console.error(error);
        return {
            message: `Error getting top holders for Solana token: ${error}`,
        };
    }
} 