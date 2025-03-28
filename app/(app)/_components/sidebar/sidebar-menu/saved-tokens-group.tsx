'use client'

import React, { useState } from 'react'

import { ChevronDown, Coins } from 'lucide-react';

import Link from 'next/link';

import { usePrivy } from '@privy-io/react-auth';

import { usePathname } from 'next/navigation';

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
} from '@/components/ui';

import { useSavedTokens } from '@/hooks';
import SaveToken from '../../save-token';

const SavedTokensGroup: React.FC = () => {

    const pathname = usePathname();

    const { user } = usePrivy();

    const { savedTokens, isLoading } = useSavedTokens();

    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible className="group/collapsible" open={isOpen} onOpenChange={setIsOpen}>
            <SidebarMenuItem>
                <Link href='/token'>
                    <CollapsibleTrigger 
                        asChild
                    >
                        <SidebarMenuButton 
                            className="justify-between w-full"
                            isActive={pathname.includes('/token')}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    <h1 className="text-sm font-semibold">Tokens</h1>
                                </div>
                                <ChevronDown 
                                    className="h-[14px] w-[14px] transition-transform group-data-[state=open]/collapsible:rotate-180 text-neutral-500 dark:text-neutral-500" 
                                />
                            </div>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </Link>
                <CollapsibleContent>
                    <SidebarMenuSub className="flex-1 overflow-hidden relative flex flex-col">
                        {
                            isLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                savedTokens.length > 0 ? (
                                    savedTokens.map((savedToken) => (
                                        <SidebarMenuSubItem
                                            key={savedToken.id}
                                        >
                                            <SidebarMenuSubButton 
                                                asChild 
                                                isActive={pathname.includes(`/token/${savedToken.id}`)}
                                            >
                                                <Link 
                                                    href={`/token/${savedToken.id}?chain=${savedToken.chain}`} 
                                                    className="flex items-center justify-between w-full gap-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <img 
                                                            src={savedToken.logoURI} 
                                                            alt={savedToken.name}
                                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                                        />
                                                        <span className='truncate'>{savedToken.symbol}</span>
                                                    </div>
                                                    <SaveToken 
                                                        address={savedToken.id} 
                                                        className='hover:bg-neutral-300 dark:hover:bg-neutral-600 flex-shrink-0'
                                                    />
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))
                                ) : (
                                    user ? (
                                        <p className='text-sm text-neutral-500 dark:text-neutral-400 pl-2 py-1'>
                                            No saved tokens
                                        </p>
                                    ) : (
                                        <p className='text-sm text-neutral-500 dark:text-neutral-400 pl-2'>
                                            Sign in to view your saved tokens
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

export default SavedTokensGroup;