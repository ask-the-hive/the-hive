"use client";

import React, { createContext, useContext, useState } from 'react';
import { useChain } from '@/app/_contexts/chain-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import Swap from '@/app/_components/swap';
import { usePortfolio } from '@/hooks/queries/portfolio/use-portfolio';
import type { Token } from '@/db/types';
import type { Portfolio } from '@/services/birdeye/types';
import type { ChainType } from '@/app/_contexts/chain-context';

interface SwapModalContextType {
    openBuy: (tokenId: string) => void;
    openSell: (tokenId: string) => void;
}

const SwapModalContext = createContext<SwapModalContextType>({
    openBuy: () => {},
    openSell: () => {},
});

export const useSwapModal = () => useContext(SwapModalContext);

interface PortfolioToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    balance: number;
    priceUsd: number;
    valueUsd: number;
}

export const SwapModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [selectedTokenId, setSelectedTokenId] = useState<string>('');
    const { currentChain } = useChain();

    // Ensure we have a valid chain type
    const effectiveChain: ChainType = currentChain || 'solana';
    
    const { data: portfolio } = usePortfolio(undefined, effectiveChain);

    const tokens: PortfolioToken[] = portfolio?.items?.map(item => ({
        address: item.address || '',
        name: item.name || '',
        symbol: item.symbol || '',
        decimals: item.decimals || 0,
        logoURI: item.logoURI,
        balance: Number(item.balance || 0),
        priceUsd: item.priceUsd || 0,
        valueUsd: item.valueUsd || 0
    })) || [];

    const openBuy = (tokenId: string) => {
        setMode('buy');
        setSelectedTokenId(tokenId);
        setIsOpen(true);
    };

    const openSell = (tokenId: string) => {
        setMode('sell');
        setSelectedTokenId(tokenId);
        setIsOpen(true);
    };

    const onClose = () => {
        setIsOpen(false);
    };

    const onSuccess = (txHash: string) => {
        console.log('Swap successful:', txHash);
        setIsOpen(false);
    };

    const onError = (error: string) => {
        console.error('Swap error:', error);
    };

    const selectedToken = tokens.find(token => token.address === selectedTokenId) || null;

    const defaultTokens = effectiveChain === 'solana' 
        ? {
            native: 'So11111111111111111111111111111111111111112', // SOL
            usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            usdt: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
        }
        : {
            native: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
            usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            usdt: '0x55d398326f99059fF775485246999027B3197955'
        };

    const getDefaultToken = () => {
        return tokens.find(token => token.address === defaultTokens.native) || null;
    };

    // Convert portfolio token to Token type
    const convertToToken = (portfolioToken: PortfolioToken | null): Token | null => {
        if (!portfolioToken) return null;
        return {
            id: portfolioToken.address,
            name: portfolioToken.name,
            symbol: portfolioToken.symbol || '',
            decimals: portfolioToken.decimals || 0,
            logoURI: portfolioToken.logoURI || '',
            tags: [],
            freezeAuthority: null,
            mintAuthority: null,
            permanentDelegate: null,
            extensions: {}
        };
    };

    return (
        <SwapModalContext.Provider value={{ openBuy, openSell }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'buy' ? 'Swap' : 'Swap'}
                        </DialogTitle>
                    </DialogHeader>
                    <Swap
                        initialInputToken={convertToToken(mode === 'buy' ? getDefaultToken() : selectedToken)}
                        initialOutputToken={convertToToken(mode === 'buy' ? selectedToken : getDefaultToken())}
                        inputLabel={mode === 'buy' ? 'From' : 'From'}
                        outputLabel={mode === 'buy' ? 'To' : 'To'}
                        onSuccess={onSuccess}
                        onError={onError}
                        onCancel={onClose}
                    />
                </DialogContent>
            </Dialog>
        </SwapModalContext.Provider>
    );
};

export default SwapModalProvider;