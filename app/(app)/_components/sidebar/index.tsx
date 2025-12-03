import React from 'react';

import {
  Sidebar as SidebarUI,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui';

import AuthButton from './auth-button';
import Logo from './logo';
import SidebarMenu from './sidebar-menu';

import OpenSidebarTrigger from './open-sidebar-trigger';
import ClosedSidebarTrigger from './closed-sidebar-trigger';
import ColorModeToggle from './color-mode-toggle';
import MobileNavbar from './mobile-navbar';

interface Props {
  children: React.ReactNode;
}

const Sidebar: React.FC<Props> = ({ children }) => {
  return (
    <>
      <SidebarUI variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <ColorModeToggle />
              <OpenSidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        {/* <SidebarSeparator /> */}
        <SidebarContent className="relative">
          <SidebarMenu />
        </SidebarContent>
        {/* <SidebarSeparator /> */}
        <SidebarFooter>
          <AuthButton />
        </SidebarFooter>
      </SidebarUI>
      <SidebarInset>
        <div className="p-2 pt-0 md:p-4 flex-1 h-0 overflow-y-hidden relative flex flex-col">
          <ClosedSidebarTrigger />
          <MobileNavbar />
          {children}
        </div>
      </SidebarInset>
    </>
  );
};

export default Sidebar;
