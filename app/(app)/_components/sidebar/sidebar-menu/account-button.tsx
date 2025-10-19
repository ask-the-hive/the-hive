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
          <h1 className="flex items-center gap-2 font-semibold">
            <User className="h-4 w-4" />
            My Account
          </h1>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </Link>
  );
};

export default AccountButton;
