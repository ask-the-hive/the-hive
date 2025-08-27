import React from 'react'
import { SpeedInsights } from "@vercel/speed-insights/next"

import { SidebarProvider } from '@/components/ui';

import Sidebar from './_components/sidebar';
import ExperimentalAlertDialog from './_components/experimental-alert-dialog';

import { GlobalChatManagerProvider } from './chat/_contexts/global-chat-manager';

interface Props {
    children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
    return (
        <SidebarProvider>
            <ExperimentalAlertDialog />
            <GlobalChatManagerProvider>
                <Sidebar>
                    {children}
                </Sidebar>
            </GlobalChatManagerProvider>
            <SpeedInsights />
        </SidebarProvider>
    )
}

export default Layout;