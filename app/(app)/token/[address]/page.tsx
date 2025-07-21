'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui";

import TokenChart from "../../_components/token/chart";
import Header from "./_components/header";
import TokenDashboardTabs from "./_components/tabs";
import SidePanel from "./_components/side-panel";
import ResizableLayout from "./_components/resizable-layout";
import { ChainType } from "@/app/_contexts/chain-context";
import { useChain } from "@/app/_contexts/chain-context";
import { useIsMobile } from '@/hooks/utils/use-mobile';

const TokenPage = () => {
    const params = useParams();
    const address = params.address as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const { currentChain } = useChain();
    const isMobile = useIsMobile();
    
    // Use URL param if available, otherwise use context
    const chainParam = searchParams.get('chain') as ChainType | null;
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;
    
    const [tokenOverview, setTokenOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Update URL when chain changes
    useEffect(() => {
        if (chain !== chainParam) {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.set('chain', chain);
            router.replace(`/token/${address}?${newSearchParams.toString()}`);
        }
    }, [chain, chainParam, address, router, searchParams]);

    useEffect(() => {
        const fetchTokenOverview = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/token/${address}/overview?chain=${chain}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch token overview');
                }
                const data = await response.json();
                setTokenOverview(data);
            } catch (error) {
                console.error(error);
                setTokenOverview(null);
            } finally {
                setLoading(false);
            }
        };

        fetchTokenOverview();
    }, [address, chain]);

    return (
        <div className={isMobile ? 'flex flex-col gap-2 min-h-screen overflow-y-auto' : 'flex flex-col gap-2 h-full max-h-full overflow-hidden'}>
            <Header address={address} />
            <ResizableLayout 
                chartComponent={<TokenChart mint={address} />}
                tabsComponent={
                    loading ? (
                        <Skeleton className="h-full w-full m-2" />
                    ) : (
                        <TokenDashboardTabs address={address} tokenOverview={tokenOverview} />
                    )
                }
                sidePanelComponent={<SidePanel address={address} />}
            />
        </div>
    );
};

export default TokenPage;