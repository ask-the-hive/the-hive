'use client';

import React from 'react';

import { ChartPie } from 'lucide-react';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui';
import { useChain } from '@/app/_contexts/chain-context';

const PortfolioButton: React.FC = () => {
  const pathname = usePathname();

  const { walletAddresses } = useChain();

  if (!walletAddresses.solana) return null;

  return (
    <Link href={`/portfolio/${walletAddresses.solana}`}>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={pathname?.includes('/portfolio') ?? false}>
          <h1 className="flex items-center gap-2 font-semibold">
            <ChartPie className="h-4 w-4" />
            Portfolio
          </h1>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </Link>
  );
};

export default PortfolioButton;
