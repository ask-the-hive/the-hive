'use client';

import React from 'react';

import { User } from 'lucide-react';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui';
import { usePrivy } from '@privy-io/react-auth';

const AccountButton: React.FC = () => {
  const pathname = usePathname();
  const { user } = usePrivy();

  const isLoggedIn = user?.wallet?.address;

  return (
    <Link href={isLoggedIn ? '/account' : '/login'}>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={pathname?.includes('/account') || pathname?.includes('/login')}
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold">My Account</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </Link>
  );
};

export default AccountButton;
