'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Card } from '@/components/ui';
import { useIsMobile } from '@/hooks/utils/use-mobile';

interface ResizableLayoutProps {
    chartComponent: React.ReactNode;
    tabsComponent: React.ReactNode;
    sidePanelComponent: React.ReactNode;
}

const ResizableLayout = ({
    chartComponent,
    tabsComponent,
    sidePanelComponent
}: ResizableLayoutProps) => {
    const isMobile = useIsMobile();
    if (isMobile) {
        return (
            <div className="flex flex-col w-full min-h-[200vh] overflow-y-auto pt-4 pb-8">
                <div className="w-full h-[320px] mb-6">{chartComponent}</div>
                <Card className="w-full">{tabsComponent}</Card>
                <Card className="w-full">{sidePanelComponent}</Card>
            </div>
        );
    }
    return (
        <div className="md:flex-1 md:h-0 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-2">
            <PanelGroup direction="horizontal" className="flex-1">
                <Panel defaultSize={66} minSize={30} className="flex flex-col gap-2">
                    <PanelGroup direction="vertical" className="h-full">
                        <Panel defaultSize={60} minSize={20}>
                            <Card className="h-full overflow-hidden max-h-full">
                                {chartComponent}
                            </Card>
                        </Panel>
                        <PanelResizeHandle className="h-2 hover:bg-accent rounded-sm transition-colors" />
                        <Panel defaultSize={40} minSize={30}>
                            <Card className="h-full overflow-hidden">
                                {tabsComponent}
                            </Card>
                        </Panel>
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="w-2 md:hover:bg-accent rounded-sm transition-colors" />
                <Panel defaultSize={33} minSize={20}>
                    <Card className="h-full flex flex-col gap-2 overflow-hidden">
                        {sidePanelComponent}
                    </Card>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default ResizableLayout; 