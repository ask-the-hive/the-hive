import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useColorMode, ColorMode } from '@/app/_contexts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { PriceChartResultType } from '@/ai/base/actions/token/price-chart/types';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const PriceChart: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting Token Price Chart...`}
      result={{
        heading: (result: PriceChartResultType) =>
          result.body ? `Base Token Price Chart` : `Failed to fetch Base token price chart`,
        body: (result: PriceChartResultType) =>
          result.body ? (
            <PriceChartBody
              tokenAddress={result.body.tokenAddress || ''}
              tokenName={result.body.tokenName}
              tokenSymbol={result.body.tokenSymbol}
              tokenLogo={result.body.tokenLogo}
            />
          ) : (
            'No token price chart found'
          ),
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

interface PriceChartBodyProps {
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogo?: string;
}

const PriceChartBody: React.FC<PriceChartBodyProps> = ({
  tokenAddress,
  tokenName,
  tokenSymbol,
  tokenLogo,
}) => {
  return (
    <div className="w-full flex flex-col gap-2">
      {tokenName && tokenSymbol && (
        <div className="w-full flex items-center gap-2">
          {tokenLogo && (
            <Image
              src={tokenLogo}
              alt={tokenName || tokenSymbol || 'Token'}
              width={32}
              height={32}
              className="rounded-full h-8 w-8 object-cover"
              unoptimized
            />
          )}
          <h3 className="text-xl font-bold">
            {tokenName} (${tokenSymbol})
          </h3>
        </div>
      )}
      <Card className="overflow-hidden h-[400px]">
        <MoralisChartWidget tokenAddress={tokenAddress} />
      </Card>
    </div>
  );
};

// Moralis Chart Widget Component
const MoralisChartWidget = ({ tokenAddress }: { tokenAddress: string }) => {
  const PRICE_CHART_ID = `price-chart-widget-container-${tokenAddress.substring(0, 8)}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode } = useColorMode();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if the script is already loaded
    const existingScript = document.getElementById('moralis-chart-widget');
    if (existingScript) {
      setIsScriptLoaded(true);
    } else {
      const script = document.createElement('script');
      script.id = 'moralis-chart-widget';
      script.src = 'https://moralis.com/static/embed/chart.js';
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        setIsScriptLoaded(true);
      };

      script.onerror = () => {
        console.error('Failed to load the chart widget script.');
      };

      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || typeof window === 'undefined' || !tokenAddress) return;

    // Wait for the script to initialize
    const checkAndCreateWidget = () => {
      if (typeof window.createMyWidget === 'function') {
        try {
          window.createMyWidget(PRICE_CHART_ID, {
            autoSize: true,
            chainId: '0x2105', // Base chain ID
            tokenAddress: tokenAddress,
            defaultInterval: '1D',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Etc/UTC',
            theme: mode === ColorMode.DARK ? 'dark' : 'light',
            locale: 'en',
            hideLeftToolbar: true,
            hideTopToolbar: false,
            hideBottomToolbar: false,
          });
          setIsWidgetLoaded(true);
        } catch (error) {
          console.error('Error creating widget:', error);
        }
      }
    };

    // Try immediately
    checkAndCreateWidget();

    // Also set up a retry mechanism
    const interval = setInterval(() => {
      if (!isWidgetLoaded && typeof window.createMyWidget === 'function') {
        checkAndCreateWidget();
      } else if (isWidgetLoaded) {
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isScriptLoaded, tokenAddress, mode, PRICE_CHART_ID, isWidgetLoaded]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {!isWidgetLoaded && (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      <div id={PRICE_CHART_ID} ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

// Add TypeScript declaration for the Moralis widget
declare global {
  interface Window {
    createMyWidget: (
      id: string,
      config: {
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
      },
    ) => void;
  }
}

export default PriceChart;
