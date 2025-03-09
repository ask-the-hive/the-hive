'use client'

import React, { useMemo } from 'react'

import { Skeleton } from '@/components/ui';

import { useNativeBalance, useTokenAccounts, usePortfolio } from '@/hooks';
import { ChainType } from '@/app/_contexts/chain-context';
import { useChain } from '@/app/_contexts/chain-context';

interface Props {
    address: string;
    chain: ChainType;
}

const Balances: React.FC<Props> = ({ address, chain }) => {
    const { walletAddresses } = useChain();
    
    // Use the appropriate address for the current chain - memoize to prevent rerenders
    const chainAddress = useMemo(() => {
        return chain === 'solana' 
            ? walletAddresses.solana || address 
            : walletAddresses.bsc || address;
    }, [chain, walletAddresses.solana, walletAddresses.bsc, address]);

    // For Solana native balances and token accounts
    const { data: tokenAccounts, isLoading: isTokenAccountsLoading, error: tokenAccountsError } = 
        useTokenAccounts(chainAddress);
    const { data: nativeBalance, isLoading: isNativeBalanceLoading, error: nativeBalanceError } = 
        useNativeBalance(chainAddress);
    
    // For BSC portfolio
    const { data: portfolio, isLoading: isPortfolioLoading } = 
        usePortfolio(chainAddress, chain);

    if (chain === 'solana') {
        // Check if we have a valid Solana address
        if (!chainAddress || chainAddress.startsWith('0x')) {
            return (
                <div className="px-2 py-2 text-sm text-yellow-500">
                    No Solana wallet connected. Please link a Solana wallet.
                </div>
            );
        }
        
        if (isTokenAccountsLoading || isNativeBalanceLoading) return (
            <Skeleton className="h-10 w-full" />
        )

        if (tokenAccountsError || nativeBalanceError) return (
            <p>Error fetching balances</p>
        )

        return (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto px-2">
                <div className="flex flex-row items-center gap-2">
                    <img 
                        src={"/solana.png"} 
                        alt={"Solana"} 
                        className="w-6 h-6 rounded-full" 
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            Solana (SOL)
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {nativeBalance?.toFixed(4) ?? '0.0000'}
                        </span>
                    </div>
                </div>
                {tokenAccounts?.map((account, index) => (
                    <div key={`token-${index}`} className="flex flex-row items-center gap-2">
                        <img 
                            src={account.token_data.logoURI} 
                            alt={account.token_data.name} 
                            className="w-6 h-6 rounded-full" 
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {account.token_data.name} ({account.token_data.symbol.toUpperCase()})
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {(account.amount / 10 ** account.token_data.decimals).toFixed(4)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )
    } else {
        // Check if we have a valid BSC address
        if (!chainAddress || !chainAddress.startsWith('0x')) {
            return (
                <div className="px-2 py-2 text-sm text-yellow-500">
                    No BSC wallet connected. Please link a BSC wallet.
                </div>
            );
        }
        
        // BSC balances
        if (isPortfolioLoading) return (
            <Skeleton className="h-10 w-full" />
        )

        if (!portfolio || !portfolio.items) return (
            <p>No BSC balances found</p>
        )

        // Sort tokens to put BNB/WBNB at the top
        const sortedTokens = [...(portfolio.items || [])].sort((a, b) => {
            // Put BNB and WBNB at the top
            if (a.symbol.toLowerCase().includes('bnb') || a.symbol.toLowerCase().includes('wbnb')) {
                return -1;
            }
            if (b.symbol.toLowerCase().includes('bnb') || b.symbol.toLowerCase().includes('wbnb')) {
                return 1;
            }
            // Otherwise sort by value
            return b.valueUsd - a.valueUsd;
        });

        return (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto px-2">
                {sortedTokens.map((token, index) => {
                    // Customize token display names
                    let displayName = token.name;
                    let displaySymbol = token.symbol.toUpperCase();
                    
                    // For Wrapped BNB, show as Binance Coin (BNB)
                    if (token.name.toLowerCase().includes('wrapped bnb') || 
                        token.symbol.toLowerCase() === 'wbnb') {
                        displayName = 'Binance Coin';
                        displaySymbol = 'BNB';
                    }
                    
                    return (
                        <div key={`token-${index}`} className="flex flex-row items-center gap-2">
                            <img 
                                src={token.logoURI || "/bsc.png"} 
                                alt={token.name} 
                                className="w-6 h-6 rounded-full" 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {displayName} ({displaySymbol})
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {token.uiAmount.toFixed(4)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }
}

export default Balances;