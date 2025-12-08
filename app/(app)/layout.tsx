import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { SidebarProvider } from '@/components/ui';

import Sidebar from './_components/sidebar';
import { MoreMenu } from './_components/more-menu';

import { GlobalChatManagerProvider } from './chat/_contexts/global-chat-manager';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <SidebarProvider>
      <GlobalChatManagerProvider>
        <Sidebar>{children}</Sidebar>
        <MoreMenu />
      </GlobalChatManagerProvider>
      <SpeedInsights />
    </SidebarProvider>
  );
};

export default Layout;
