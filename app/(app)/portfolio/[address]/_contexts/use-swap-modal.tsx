"use client";

import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Swap from '@/app/_components/swap';
import { Token } from '@/db/types/token';

interface SwapModalContextType {
    isOpen: boolean;
    mode: 'buy' | 'sell';
    tokenAddress: string;
    onOpen: (mode: 'buy' | 'sell', tokenAddress: string) => void;
    onClose: () => void;
}

const SwapModalContext = createContext<SwapModalContextType>({
    isOpen: false,
    mode: 'buy',
    tokenAddress: '',
    onOpen: () => {},
    onClose: () => {},
});

export const useSwapModal = () => useContext(SwapModalContext);

export const SwapModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [tokenAddress, setTokenAddress] = useState('');

    const onOpen = (mode: 'buy' | 'sell', tokenAddress: string) => {
        setMode(mode);
        setTokenAddress(tokenAddress);
        setIsOpen(true);
    };

    const onClose = () => {
        setIsOpen(false);
    };

    const onSuccess = () => {
        onClose();
    };

    const onError = (error: string) => {
        console.error('Swap error:', error);
    };

    const token: Token = {
        id: tokenAddress,
        name: '',
        symbol: '',
        decimals: 0,
        logoURI: '',
        tags: [],
        freezeAuthority: null,
        mintAuthority: null,
        permanentDelegate: null,
        extensions: {}
    };

    return (
        <SwapModalContext.Provider value={{
            isOpen,
            mode,
            tokenAddress,
            onOpen,
            onClose,
        }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'buy' ? 'Buy' : 'Sell'}
                        </DialogTitle>
                    </DialogHeader>
                    <Swap
                        initialInputToken={mode === 'buy' ? null : token}
                        initialOutputToken={mode === 'buy' ? token : null}
                        inputLabel={mode === 'buy' ? 'Pay with' : 'Sell'}
                        outputLabel={mode === 'buy' ? 'Buy' : 'Receive'}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </DialogContent>
            </Dialog>
        </SwapModalContext.Provider>
    );
};

export default SwapModalProvider;