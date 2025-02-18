import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui";

import TokenChart from "../../_components/token/chart";
import Header from "./_components/header";
import TokenDashboardTabs from "./_components/tabs";
import SidePanel from "./_components/side-panel";
import ResizableLayout from "./_components/resizable-layout";
import { getTokenOverview } from '@/services/birdeye';

const TokenPage = async ({ params }: { params: Promise<{ address: string }> }) => {
    const { address } = await params;
    const tokenOverview = await getTokenOverview(address);

    return (
        <div className="flex flex-col gap-2 h-full max-h-full overflow-hidden">
            <Header address={address} />
            <ResizableLayout 
                chartComponent={<TokenChart mint={address} />}
                tabsComponent={
                    <Suspense fallback={<Skeleton className="h-full w-full m-2" />}>
                        <TokenDashboardTabs address={address} tokenOverview={tokenOverview} />
                    </Suspense>
                }
                sidePanelComponent={<SidePanel address={address} />}
            />
        </div>
    );
};

export default TokenPage;