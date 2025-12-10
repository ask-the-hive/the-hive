'use client';

import { Droplet, Zap, HandCoins } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui';
import posthog from 'posthog-js';

const shortcuts = [
  {
    title: 'Stake SOL',
    description: 'Earn the highest yields with liquid staking',
    icon: Droplet,
    prompt: 'Find me the best staking yields on Solana',
    eventName: 'stake_strategy_clicked',
  },
  {
    title: 'Lend Stablecoins',
    description: 'Lend stablecoins to earn interest',
    icon: HandCoins,
    prompt: 'Show me the best lending pools on Solana',
    eventName: 'lend_strategy_clicked',
  },
] as const;

const ShortcutsGroup = () => {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleShortcutClick = (prompt: string) => {
    // Navigate to /chat with the prompt as a message query parameter
    router.push(`/chat?message=${encodeURIComponent(prompt)}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="justify-between w-full pointer-events-none">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <h1 className="text-sm font-semibold">Shortcuts</h1>
        </div>
      </SidebarMenuButton>
      <SidebarMenuSub>
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <SidebarMenuSubItem key={shortcut.title}>
              <SidebarMenuSubButton
                onClick={() => {
                  handleShortcutClick(shortcut.prompt);
                  posthog.capture(shortcut.eventName);
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate text-xs">{shortcut.title}</span>
                </div>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
};

export default ShortcutsGroup;
