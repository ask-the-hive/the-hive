import React, { useEffect, useRef } from 'react';
import { useColorMode, ColorMode } from '@/app/_contexts';

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
    const containerRef = useRef(null);
    const { mode } = useColorMode();
    const scriptLoadedRef = useRef(false);

    const createWidget = () => {
        if (typeof window.createMyWidget === 'function') {
            window.createMyWidget(PRICE_CHART_ID, {
                autoSize: true,
                chainId: '0x38',
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
    }, [tokenAddress, mode]);

    return (
        <div className='flex flex-col h-full w-full'>
            <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-1 bg-neutral-100 dark:bg-neutral-700 p-2'>
                <p className='text-md md:text-lg font-bold'>
                    ${price.toLocaleString(undefined, { maximumFractionDigits: 5 }) || '0.00'} 
                    <span className={priceChange > 0 ? 'text-green-500' : 'text-red-500'}>
                        ({priceChange > 0 ? '+' : ''}{priceChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)
                    </span>
                </p>
            </div>
            <div className='flex-1 h-0'>
                <div
                    id={PRICE_CHART_ID}
                    ref={containerRef}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
        </div>
    );
};

export default MoralisChart; 