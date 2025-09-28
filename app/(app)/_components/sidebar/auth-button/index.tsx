'use client';

import React, { useState } from 'react';

import { ChevronsUpDown, Coins, LogIn, LogOut, Wallet, AlertCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

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
  const [copied, setCopied] = useState(false);
  const { user, ready, login, logout, linkWallet, fundWallet, fundBscWallet } = useLogin({
    onComplete: () => {},
  });
  const [showBaseBridges, setShowBaseBridges] = useState(false);
  const [showBaseBridgeOptions, setShowBaseBridgeOptions] = useState(false);

  const { currentChain, setCurrentChain, walletAddresses, currentWalletAddress } = useChain();
  console.log('walletAddresses - AuthButton', walletAddresses);
  console.log('currentWalletAddress - AuthButton', currentWalletAddress);
  console.log('currentChain - AuthButton', currentChain);
  const { isMobile } = useSidebar();

  // Handle chain switching
  const handleChainSwitch = (chain: ChainType) => {
    setCurrentChain(chain);
  };

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentWalletAddress && currentWalletAddress !== 'No Wallet Connected') {
      navigator.clipboard.writeText(currentWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!ready) return <Skeleton className="w-full h-8" />;

  if (!user || !user.wallet)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            variant="brandOutline"
            onClick={() => {
              if (user) {
                linkWallet();
              } else {
                login();
              }
            }}
            className="w-full justify-center gap-0"
          >
            <LogIn className="h-4 w-4" />
            <span className="ml-2">Connect Wallet</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

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
                {displayAddress === 'No Wallet Connected'
                  ? 'Connect Wallet'
                  : truncateAddress(displayAddress)}
              </span>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            {showBaseBridges ? (
              <>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <button
                      onClick={() => setShowBaseBridges(false)}
                      className="flex items-center gap-2 hover:text-accent-foreground"
                    >
                      <ArrowLeft className="size-4" />
                      <span>Back to Wallet</span>
                    </button>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      if (walletAddresses.base) {
                        window.open(`https://superbridge.app/base`, '_blank');
                      }
                    }}
                    className="gap-2"
                  >
                    <ChainIcon chain="base" className="size-4" />
                    Superbridge
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (walletAddresses.base) {
                        window.open(
                          `https://www.brid.gg/base?amount=&originChainId=1&token=ETH`,
                          '_blank',
                        );
                      }
                    }}
                    className="gap-2"
                  >
                    <ChainIcon chain="base" className="size-4" />
                    Brid.gg
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Wallet className="size-4" />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <button onClick={handleCopyAddress} className="flex items-center gap-1 w-fit">
                        <span className="truncate font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 px-1.5 py-0.5 rounded transition-colors">
                          {displayAddress === 'No Wallet Connected'
                            ? displayAddress
                            : truncateAddress(displayAddress)}
                        </span>
                        {copied && <span className="text-xs text-brand-600 ml-1">Copied!</span>}
                      </button>
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
                        {!walletAddresses.solana && (
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                        )}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bsc" id="bsc" />
                      <Label htmlFor="bsc" className="flex items-center gap-1">
                        <ChainIcon chain="bsc" className="w-4 h-4" />
                        BSC
                        {!walletAddresses.bsc && (
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                        )}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="base" id="base" />
                      <Label htmlFor="base" className="flex items-center gap-1">
                        <ChainIcon chain="base" className="w-4 h-4" />
                        Base
                        {!walletAddresses.base && (
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <DropdownMenuSeparator />
                {hasCurrentChainWallet ? (
                  <Balances address={currentWalletAddress!} chain={currentChain} />
                ) : (
                  <div className="px-2 py-2 text-sm text-muted-foreground">No tokens found</div>
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
                    <DropdownMenuItem
                      onClick={() => {
                        if (walletAddresses.solana) {
                          fundWallet(walletAddresses.solana, { amount: '0.01' });
                        }
                      }}
                    >
                      <Coins className="size-4" />
                      Fund Wallet
                    </DropdownMenuItem>
                  )}

                  {/* Fund wallet button for BSC */}
                  {currentChain === 'bsc' && walletAddresses.bsc && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (walletAddresses.bsc) {
                          fundBscWallet(walletAddresses.bsc);
                        }
                      }}
                    >
                      <Coins className="size-4" />
                      Fund Wallet
                    </DropdownMenuItem>
                  )}

                  {/* Fund wallet button for Base */}
                  {currentChain === 'base' && walletAddresses.base && (
                    <>
                      {showBaseBridgeOptions ? (
                        <>
                          <div className="px-2 py-1.5">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setShowBaseBridgeOptions(false);
                              }}
                              className="p-1"
                            >
                              <ArrowLeft className="size-4 text-muted-foreground" />
                            </button>
                          </div>
                          <DropdownMenuItem
                            onClick={() => {
                              if (walletAddresses.base) {
                                window.open(`https://superbridge.app/base`, '_blank');
                              }
                            }}
                            className="gap-2"
                          >
                            <Image
                              src="https://avatars.githubusercontent.com/u/136572167?s=200&v=4"
                              alt="Superbridge"
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                            Superbridge
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (walletAddresses.base) {
                                window.open(
                                  `https://www.brid.gg/base?amount=&originChainId=1&token=ETH`,
                                  '_blank',
                                );
                              }
                            }}
                            className="gap-2"
                          >
                            <Image
                              src="https://avatars.githubusercontent.com/u/170143979?s=280&v=4"
                              alt="Brid.gg"
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                            Brid.gg
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setShowBaseBridgeOptions(true);
                          }}
                        >
                          <Coins className="size-4" />
                          Fund Wallet
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default AuthButton;
