'use client';

import React from 'react';

import { SidebarMenu as SidebarMenuUI } from '@/components/ui';

import ChatsGroup from './chats-group';
import AccountButton from './account-button';
import PortfolioButton from './portfolio-button';
// import SavedTokensGroup from './saved-tokens-group';

const SidebarMenu: React.FC = () => {
  return (
    <SidebarMenuUI className="flex flex-col justify-center min-h-full">
      <div className="flex flex-col gap-2 transition-all duration-300 ease-in-out">
        <AccountButton />
        <ChatsGroup />
        <PortfolioButton />
      </div>
    </SidebarMenuUI>
  );
};

export default SidebarMenu;
