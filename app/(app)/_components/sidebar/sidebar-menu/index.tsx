'use client';

import React from 'react';
import { SidebarMenu as SidebarMenuUI } from '@/components/ui';
import ShortcutsGroup from './shortcuts-group';
import AccountButton from './account-button';
import PortfolioButton from './portfolio-button';
import ChatsGroup from './chats-group';

const SidebarMenu: React.FC = () => {
  return (
    <SidebarMenuUI className="flex flex-start">
      <div className="flex flex-col gap-2 transition-all duration-300 ease-in-out">
        <AccountButton />
        <PortfolioButton />
        <ChatsGroup />
        <ShortcutsGroup />
      </div>
    </SidebarMenuUI>
  );
};

export default SidebarMenu;
