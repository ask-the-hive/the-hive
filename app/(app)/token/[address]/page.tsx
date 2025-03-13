'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui";

import TokenChart from "../../_components/token/chart";
import Header from "./_components/header";
import TokenDashboardTabs from "./_components/tabs";
import SidePanel from "./_components/side-panel";
import ResizableLayout from "./_components/resizable-layout";
import { ChainType } from "@/app/_contexts/chain-context";
import { useChain } from "@/app/_contexts/chain-context";

const TokenPage = () => {
    const params = useParams();
    const address = params.address as string;
    const searchParams = useSearchParams();
    const { currentChain } = useChain();
    
    // Use URL param if available, otherwise use context
    const chainParam = searchParams.get('chain') as ChainType | null;
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;
    
    const [tokenOverview, setTokenOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        <div className="flex flex-col gap-2 h-full max-h-full overflow-hidden">
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