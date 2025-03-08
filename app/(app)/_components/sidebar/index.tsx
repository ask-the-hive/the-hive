import React from 'react'

import Link from 'next/link';

import { FaDiscord, FaXTwitter } from 'react-icons/fa6';

import {
    Sidebar as SidebarUI, 
    SidebarHeader, 
    SidebarContent, 
    SidebarInset,
    SidebarFooter,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    SidebarMenu as SidebarMenuUI,
} from '@/components/ui'

import AuthButton from './auth-button';
import Logo from './logo';
import SidebarMenu from './sidebar-menu';

import OpenSidebarTrigger from './open-sidebar-trigger';
import ClosedSidebarTrigger from './closed-sidebar-trigger';
import ColorModeToggle from './color-mode-toggle';
import MobileNavbar from './mobile-navbar';

interface Props {
    children: React.ReactNode;
}

const Sidebar: React.FC<Props> = ({ children }) => {

    return (
        <>
            <SidebarUI variant="inset" collapsible='icon'>
                <SidebarHeader>
                    <div className="flex items-center justify-between">
                        <Logo />
                        <div className="flex items-center gap-2">
                            <ColorModeToggle />
                            <OpenSidebarTrigger />
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarSeparator />
                <SidebarContent className="relative">
                    <SidebarMenu />
                </SidebarContent>
                <SidebarSeparator />
                <SidebarFooter>
                    <SidebarMenuUI>
                        <AuthButton />
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                asChild 
                            >
                                <Link 
                                    href={"https://x.com/askthehive_ai"} 
                                    target={'_blank'}
                                >
                                    <FaXTwitter />
                                    <span className='truncate'>Follow Twitter</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                asChild 
                            >
                                <Link 
                                    href={"https://discord.gg/8TVcFvySWG"} 
                                    target={'_blank'}
                                >
                                    <FaDiscord />
                                    <span className='truncate'>Join Discord</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenuUI>
                </SidebarFooter>
            </SidebarUI>
            <SidebarInset>
                <div className="p-2 pt-0 md:p-4 flex-1 h-0 overflow-y-hidden relative flex flex-col">
                    <ClosedSidebarTrigger />
                    <MobileNavbar />
                    {children}
                </div>
            </SidebarInset>
        </>
    )
}

export default Sidebar;