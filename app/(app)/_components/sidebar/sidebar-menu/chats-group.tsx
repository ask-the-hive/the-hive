'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui';

/**
 * Chat history is disabled, but keep a quick entry to the chat page.
 */
const ChatsGroup: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={pathname.includes('/chat')}
        className="justify-between w-full"
        onClick={() => router.push('/chat')}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h1 className="text-sm font-semibold">Chats</h1>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default ChatsGroup;
