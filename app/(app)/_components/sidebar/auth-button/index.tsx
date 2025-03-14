'use client'

import React from 'react'

import { ChevronsUpDown, Coins, LogIn, LogOut, Wallet, AlertCircle } from 'lucide-react';

import { useLogin } from '@/hooks';
import { useChain, ChainType } from '@/app/_contexts/chain-context';
import ChainIcon from '@/app/(app)/_components/chain-icon';

import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuItem,
    useSidebar,
    Skeleton,
} from '@/components/ui';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import Balances from './balances';

import { truncateAddress } from '@/lib/wallet';

const AuthButton: React.FC = () => {
    const { user, ready, login, logout, linkWallet, fundWallet, fundBscWallet } = useLogin({
        onComplete: () => {}
    });

    const { 
        currentChain, 
        setCurrentChain, 
        walletAddresses, 
        currentWalletAddress 
    } = useChain();
    
    const { isMobile } = useSidebar();

    // Handle chain switching
    const handleChainSwitch = (chain: ChainType) => {
        setCurrentChain(chain);
    };

    if (!ready) return <Skeleton className="w-full h-8" />;

    if (!user || !user.wallet) return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton 
                    variant="brandOutline"
                    onClick={() => { if(user) { linkWallet() } else { login() } }}
                    className="w-full justify-center gap-0"
                >
                    <LogIn className="h-4 w-4" />
                    <span className="ml-2">
                        Connect Wallet
                    </span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )

    // Check if the current chain has a wallet connected
    const hasCurrentChainWallet = !!walletAddresses[currentChain];
    
    // Get the appropriate address to display
    const displayAddress = hasCurrentChainWallet ? currentWalletAddress : 'No Wallet Connected';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            variant="brandOutline"
                        >
                            <Wallet className="size-8" />
                            <span className="ml-2">
                                {displayAddress === 'No Wallet Connected' ? 'Connect Wallet' : truncateAddress(displayAddress)}
                            </span>
                        <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Wallet className="size-4" />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {displayAddress === 'No Wallet Connected' ? displayAddress : truncateAddress(displayAddress)}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <div className="px-2 py-2">
                            <RadioGroup 
                                value={currentChain} 
                                className="flex gap-4"
                                onValueChange={(value: string) => handleChainSwitch(value as ChainType)}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="solana" id="solana" />
                                    <Label htmlFor="solana" className="flex items-center gap-1">
                                        <ChainIcon chain="solana" className="w-4 h-4" />
                                        Solana
                                        {!walletAddresses.solana && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bsc" id="bsc" />
                                    <Label htmlFor="bsc" className="flex items-center gap-1">
                                        <ChainIcon chain="bsc" className="w-4 h-4" />
                                        BSC
                                        {!walletAddresses.bsc && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        <DropdownMenuSeparator />
                        {hasCurrentChainWallet ? (
                            <Balances address={currentWalletAddress!} chain={currentChain} />
                        ) : (
                            <div className="px-2 py-2 text-sm text-muted-foreground">
                                No tokens found
                            </div>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {/* Only show Link New Wallet button if no wallet is connected for the current chain */}
                            {!hasCurrentChainWallet && (
                                <DropdownMenuItem onClick={() => linkWallet()}>
                                    <Wallet className="size-4" />
                                    Connect Wallet
                                </DropdownMenuItem>
                            )}
                            
                            {/* Fund wallet button for Solana */}
                            {currentChain === 'solana' && walletAddresses.solana && (
                                <DropdownMenuItem onClick={() => {
                                    if (walletAddresses.solana) {
                                        fundWallet(walletAddresses.solana, { amount: "0.01" });
                                    }
                                }}>
                                    <Coins className="size-4" />
                                    Fund Wallet
                                </DropdownMenuItem>
                            )}
                            
                            {/* Fund wallet button for BSC */}
                            {currentChain === 'bsc' && walletAddresses.bsc && (
                                <DropdownMenuItem onClick={() => {
                                    if (walletAddresses.bsc) {
                                        fundBscWallet(walletAddresses.bsc);
                                    }
                                }}>
                                    <Coins className="size-4" />
                                    Fund Wallet
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()}>
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default AuthButton;