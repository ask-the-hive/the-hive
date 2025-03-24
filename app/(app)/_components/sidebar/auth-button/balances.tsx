'use client'

import React, { useMemo } from 'react'

import { Skeleton } from '@/components/ui';
import ChainIcon from '@/app/(app)/_components/chain-icon';

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
                    <ChainIcon chain="solana" className="w-6 h-6" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            Solana (SOL)
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {nativeBalance?.toFixed(4) ?? '0.0000'}
                        </span>
                    </div>
                </div>
                {tokenAccounts && tokenAccounts.length > 0 ? (
                    <>
                        {tokenAccounts.map((account, index) => (
                            <div key={index} className="flex flex-row items-center gap-2">
                                {account.token_data.logoURI ? (
                                    <img 
                                        src={account.token_data.logoURI} 
                                        alt={account.token_data.name || account.token_data.symbol || 'Token'} 
                                        className="w-6 h-6 rounded-full" 
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                                        <span className="text-xs">{account.token_data.symbol?.charAt(0) || '?'}</span>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                        {account.token_data.name || account.token_data.symbol || 'Unknown Token'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {(account.amount / 10 ** account.token_data.decimals).toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-sm text-muted-foreground px-1">
                        No tokens found
                    </div>
                )}
            </div>
        )
    } else if (chain === 'bsc') {
        // Check if we have a valid BSC address
        if (!chainAddress || !chainAddress.startsWith('0x')) {
            return (
                <div className="px-2 py-2 text-sm text-yellow-500">
                    No BSC wallet connected. Please link a BSC wallet.
                </div>
            );
        }
        
        if (isPortfolioLoading) return (
            <Skeleton className="h-10 w-full" />
        )

        // BSC balances
        if (!portfolio || !portfolio.items || portfolio.items.length === 0) return (
            <div className="px-2 py-2 text-sm text-muted-foreground">
                No tokens found
            </div>
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
                    
                    // Use ChainIcon for BNB
                    const isBNB = token.symbol.toLowerCase() === 'bnb' || 
                                 token.symbol.toLowerCase() === 'wbnb';
                    
                    return (
                        <div key={`token-${index}`} className="flex flex-row items-center gap-2">
                            {isBNB ? (
                                <ChainIcon chain="bsc" className="w-6 h-6" />
                            ) : (
                                <img 
                                    src={token.logoURI || "/bsc.png"} 
                                    alt={token.name} 
                                    className="w-6 h-6 rounded-full" 
                                />
                            )}
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

    return (
        <div className="px-2 py-2 text-sm">
            No balances available
        </div>
    )
}

export default Balances;