import React, { useEffect, useRef } from 'react';
import { useColorMode, ColorMode } from '@/app/_contexts';
import { useSearchParams } from 'next/navigation';
import { useChain } from '@/app/_contexts/chain-context';
import { ChainType } from '@/app/_contexts/chain-context';
import { useIsMobile } from '@/hooks/utils/use-mobile';

declare global {
    interface Window {
        createMyWidget: (id: string, config: {
            autoSize: boolean;
            chainId: string;
            tokenAddress: string;
            defaultInterval: string;
            timeZone: string;
            theme: string;
            locale: string;
            hideLeftToolbar: boolean;
            hideTopToolbar: boolean;
            hideBottomToolbar: boolean;
        }) => void;
    }
}

const PRICE_CHART_ID = 'price-chart-widget-container';

interface Props {
    tokenAddress: string;
    price: number;
    priceChange: number;
}

const MoralisChart: React.FC<Props> = ({ tokenAddress, price, priceChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { mode } = useColorMode();
    const scriptLoadedRef = useRef(false);
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;

    const createWidget = () => {
        // Remove old widget container if it exists
        const oldWidget = document.getElementById(PRICE_CHART_ID);
        if (oldWidget && oldWidget.parentNode) {
            oldWidget.parentNode.removeChild(oldWidget);
        }
        // Create a new container div
        const newDiv = document.createElement('div');
        newDiv.id = PRICE_CHART_ID;
        newDiv.style.width = '100%';
        newDiv.style.height = isMobile ? '300px' : '100%';
        if (containerRef.current instanceof HTMLDivElement) {
            containerRef.current.appendChild(newDiv);
        }
        // Now create the widget
        if (typeof window.createMyWidget === 'function') {
            window.createMyWidget(PRICE_CHART_ID, {
                autoSize: true,
                chainId: chain === 'bsc' ? '0x38' : chain === 'base' ? '0x2105' : 'solana',
                tokenAddress: tokenAddress,
                defaultInterval: '1D',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Etc/UTC',
                theme: mode === ColorMode.DARK ? 'dark' : 'light',
                locale: 'en',
                hideLeftToolbar: true,
                hideTopToolbar: false,
                hideBottomToolbar: false
            });
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkAndCreateWidget = () => {
            if (typeof window.createMyWidget === 'function') {
                createWidget();
            }
        };

        if (!document.getElementById('moralis-chart-widget')) {
            const script = document.createElement('script');
            script.id = 'moralis-chart-widget';
            script.src = 'https://moralis.com/static/embed/chart.js';
            script.type = 'text/javascript';
            script.async = true;
            
            script.onload = () => {
                scriptLoadedRef.current = true;
                // Wait a bit to ensure the script is fully initialized
                setTimeout(checkAndCreateWidget, 500);
            };
            
            document.body.appendChild(script);
        } else if (scriptLoadedRef.current) {
            createWidget();
        }

        // Check periodically for widget function availability
        const interval = setInterval(() => {
            if (!scriptLoadedRef.current && typeof window.createMyWidget === 'function') {
                scriptLoadedRef.current = true;
                createWidget();
                clearInterval(interval);
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [tokenAddress, mode, chain]);

    const isMobile = useIsMobile();

    return (
        <div className={isMobile ? 'flex flex-col w-full min-h-[300px]' : 'flex flex-col h-full w-full'} ref={containerRef}>
            <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-1 bg-neutral-100 dark:bg-neutral-700 p-2'>
                <p className='text-md md:text-lg font-bold'>
                    ${(price || 0).toLocaleString(undefined, { maximumFractionDigits: 5 })} 
                    <span className={(priceChange || 0) > 0 ? 'text-green-500' : 'text-red-500'}>
                        ({(priceChange || 0) > 0 ? '+' : ''}{(priceChange || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}%)
                    </span>
                </p>
            </div>
            {/* Widget container will be created dynamically */}
        </div>
    );
};

export default MoralisChart; 