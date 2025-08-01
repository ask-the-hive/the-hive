'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Loader2, MessageSquare, Trash2, Plus } from 'lucide-react';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { usePrivy } from '@privy-io/react-auth';

import { 
    SidebarMenuItem, 
    SidebarMenuButton,
    Skeleton,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from '@/components/ui';

import { useUserChats } from '@/hooks';

import { useChat } from '../../../chat/_contexts/chat';
import { useSidebarContext } from '@/app/(app)/_contexts/sidebar-context';

import { cn } from '@/lib/utils';
import { ChainType } from '@/app/_contexts/chain-context';
import ChainIcon from '@/app/(app)/_components/chain-icon';

const ChatChainIcon = ({ chain }: { chain?: ChainType }) => {
    // Default to solana if no chain is specified, but use the chat's chain if available
    const chainType = chain || 'solana';
    return <ChainIcon chain={chainType} className="h-3.5 w-3.5 shrink-0" />;
};

const ChatsGroup: React.FC = () => {

    const pathname = usePathname();

    const { isMobile, setOpenMobile } = useSidebar();

    const { ready, user, getAccessToken } = usePrivy();

    const { chats, isLoading, mutate } = useUserChats();

    const { setChat, chatId, resetChat } = useChat();

    // Use the sidebar context to control the dropdown state
    const { isChatsOpen, setIsChatsOpen } = useSidebarContext();
    
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    
    // Track the previous chats length to detect when a new chat is added
    const [prevChatsLength, setPrevChatsLength] = useState(0);
    
    // Effect to automatically open the dropdown when a new chat is added
    useEffect(() => {
        if (!isLoading && chats.length > prevChatsLength && prevChatsLength > 0) {
            // A new chat was added, open the dropdown
            setIsChatsOpen(true);
        }
        
        // Update the previous chats length
        if (!isLoading) {
            setPrevChatsLength(chats.length);
        }
    }, [chats.length, isLoading, prevChatsLength, setIsChatsOpen]);

    const handleDelete = async (deletedChatId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user || deletingChatId) return;

        setDeletingChatId(deletedChatId);
        
        try {
            const response = await fetch(`/api/chats/${deletedChatId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${await getAccessToken()}`,
                },
            });
            
            if (response.ok) {
                mutate(chats.filter((chat) => chat.id !== deletedChatId));
                
                if (deletedChatId === chatId) {
                    resetChat();
                    if (isMobile) {
                        setOpenMobile(false);
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        } finally {
            setDeletingChatId(null);
        }
    };

    return (
        <Collapsible 
            className="group/collapsible" 
            open={isChatsOpen} 
            onOpenChange={setIsChatsOpen}
        >
            <SidebarMenuItem>
                <Link href='/chat'>
                    <CollapsibleTrigger 
                        asChild
                    >
                        <SidebarMenuButton 
                            className="justify-between w-full"
                            isActive={pathname.includes('/chat')}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <h1 className="text-sm font-semibold">Chats</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div 
                                        onClick={() => {
                                            resetChat();
                                            if (isMobile) {
                                                setOpenMobile(false);
                                            }
                                        }}
                                        className="h-fit w-fit p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <ChevronDown 
                                        className="h-[14px] w-[14px] transition-transform group-data-[state=open]/collapsible:rotate-180 text-neutral-500 dark:text-neutral-500" 
                                    />
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </Link>
                <CollapsibleContent>
                    <SidebarMenuSub className="flex-1 overflow-hidden relative flex flex-col">
                        {
                            isLoading || !ready ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                chats.length > 0 ? (
                                    chats.map((chat) => (
                                        <SidebarMenuSubItem
                                            key={chat.id}
                                            className="group/chat"
                                        >
                                            <SidebarMenuSubButton 
                                                asChild 
                                                isActive={chat.id === chatId}
                                                onClick={() => setChat(chat.id)}
                                            >
                                                <Link 
                                                    href={`/chat`} 
                                                    className="flex items-center justify-between w-full"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <ChatChainIcon chain={chat.chain} />
                                                        <span className='truncate'>{chat.tagline}</span>
                                                    </div>
                                                    <div
                                                        onClick={(e) => handleDelete(chat.id, e)}
                                                        className={cn(
                                                            "size-6 shrink-0 dark:hover:bg-neutral-700 hover:bg-neutral-200 rounded-md transition-all duration-300 flex items-center justify-center opacity-0 group-hover/chat:opacity-100",
                                                            deletingChatId === chat.id && "opacity-50 pointer-events-none"
                                                        )}
                                                    >
                                                        {deletingChatId === chat.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-4 text-red-600" />
                                                        )}
                                                    </div>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))
                                ) : (
                                    user ? (
                                        <p className='text-sm text-neutral-500 dark:text-neutral-400 pl-2'>
                                            No chats found
                                        </p>
                                    ) : (
                                        <p className='text-sm text-neutral-500 dark:text-neutral-400 pl-2'>
                                            Sign in to save chats
                                        </p>
                                    )
                                )
                            )
                        }
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

export default ChatsGroup;