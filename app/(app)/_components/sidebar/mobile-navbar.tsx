'use client';

import React from 'react';

import { Logo, SidebarTrigger } from '@/components/ui';

const MobileNavbar: React.FC = () => {
  return (
    <div className="flex items-center md:hidden gap-2 pt-4 pb-2">
      <SidebarTrigger />
      <Logo showText={false} className="hidden dark:hidden" />
    </div>
  );
};

export default MobileNavbar;
