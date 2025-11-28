'use client';

import { Droplet, ChartLine, ChartCandlestick, Brain, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui';
//
const shortcuts = [
  {
    title: 'Stake',
    description: 'Earn the highest yields with liquid staking',
    icon: Droplet,
    prompt: 'Find me the best staking yields on Solana',
  },
  {
    title: 'Lend',
    description: 'Lend stablecoins to earn interest',
    icon: ChartLine,
    prompt: 'Show me the best lending pools on Solana',
  },
  {
    title: 'Swap',
    description: 'Swap on Jupiter',
    icon: ChartCandlestick,
    prompt: "Let's trade some tokens",
  },
  {
    title: 'Discover',
    description: 'Discover trending Solana tokens',
    icon: Brain,
    prompt: 'Show me trending Solana tokens',
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
                onClick={() => handleShortcutClick(shortcut.prompt)}
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
