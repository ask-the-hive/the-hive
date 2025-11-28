'use client';

import React, { useState, useEffect } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Input,
  Skeleton,
} from '@/components/ui';
import { Card } from '@/components/ui/card';
import { LogOut, Upload, User, Edit2, Trash2, Plus, Copy } from 'lucide-react';

import { type User as PrivyUser, usePrivy } from '@privy-io/react-auth';
import { truncateAddress } from '@/lib/wallet';
import { useCopyToClipboard } from '@/hooks/utils';
import { useLogin } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { pfpURL } from '@/lib/pfp';
import { uploadImage } from '@/services/storage';
import { getUserData, updateUserUsername } from './actions';
import * as Sentry from '@sentry/nextjs';

interface Props {
  user: PrivyUser;
}

const AccountHeading: React.FC<Props> = ({ user }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // const [copied, setCopied] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { linkWallet, logout } = useLogin({
    onError: (err: any) => {
      if (!err?.includes('exited_auth_flow')) {
        Sentry.captureException(err, {
          tags: {
            component: 'AccountHeading',
            action: 'login',
          },
        });
      }
    },
  });
  const { unlinkWallet } = usePrivy();
  const { isCopied: isAddressCopied, copyToClipboard: copyAddress } = useCopyToClipboard({
    timeout: 10000,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserData(user.id);
      if (userData) {
        if (
          (userData.username.length === 25 && !userData.username.includes(' ')) ||
          userData.username === ''
        ) {
          setUsername('Add name');
        } else {
          setUsername(userData.username);
        }
      } else {
        setUsername('Add name');
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [user.id]);

  // Format user ID by removing the 'did:privy:' prefix
  // const formatUserId = (id: string) => {
  //   return id.replace('did:privy:', '');
  // };

  // Get the formatted user ID
  // const formattedUserId = formatUserId(user.id);

  // Handle profile picture upload
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const newFileName = `${user.id}`;
      const renamedFile = new File([file], newFileName, { type: file.type });
      await uploadImage(renamedFile);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle copying user ID to clipboard
  // const handleCopyUserId = () => {
  //   navigator.clipboard.writeText(formattedUserId);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  // Handle username update
  const handleUsernameUpdate = async () => {
    if (!username.trim()) return;
    await updateUserUsername(user.id, username.trim());
    setIsEditingUsername(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <Card className="flex flex-row gap-4 p-8">
          <div className="w-32">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-30 w-full" />
            <Skeleton className="h-30 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Account</h1>
        <Button variant="ghost" onClick={() => logout()} className="gap-2">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
      <Card className="flex flex-row gap-6 p-8">
        {/* Left Column - Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <Avatar className="w-24 h-24 dark:bg-neutral-700 cursor-pointer border border-neutral-200 dark:border-brand-700 rounded-full shadow-brand-500/50">
              <AvatarFallback className="dark:bg-neutral-700">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </AvatarFallback>
              <AvatarImage src={pfpURL(user) || ''} />
            </Avatar>
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label
                htmlFor="profile-upload"
                className="cursor-pointer w-full h-full flex items-center justify-center"
              >
                <Upload className="h-5 w-5 text-white" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {isEditingUsername ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button variant="ghost" size="sm" onClick={handleUsernameUpdate}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                <p className="text-md font-bold">{username}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2"
                  onClick={() => setIsEditingUsername(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-xs text-neutral-500">
              Joined on {user.createdAt.toLocaleDateString()}
            </p>
          </div>

          {/* <Separator /> */}
          {/* <div className="flex flex-col">
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">User ID</p>
            <TooltipProvider delayDuration={0}>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <p
                    className="text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-1 rounded transition-colors"
                    onClick={handleCopyUserId}
                  >
                    {formattedUserId}
                  </p>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied!' : 'Copy to clipboard'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div> */}
          <Separator className="my-4" />
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                Connected Wallets
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => linkWallet()}
              >
                <Plus className="h-3 w-3" />
                Connect New Wallet
              </Button>
            </div>
            <div className="flex flex-col gap-4 pt-2">
              {user.linkedAccounts
                .filter((account) => account.type === 'wallet')
                .map((account) => {
                  if (account.address.startsWith('0x')) {
                    // For EVM addresses, show both BSC and Base
                    return (
                      <React.Fragment key={account.address}>
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] leading-none px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
                              BSC
                            </span>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-mono">
                                {truncateAddress(account.address)}
                              </p>
                              <TooltipProvider>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => copyAddress(account.address)}
                                      className="hover:text-brand-600 cursor-pointer"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isAddressCopied ? 'Copied!' : 'Copy address'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={() => unlinkWallet(account.address)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] leading-none px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
                              BASE
                            </span>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-mono">
                                {truncateAddress(account.address)}
                              </p>
                              <TooltipProvider>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => copyAddress(account.address)}
                                      className="hover:text-brand-600 cursor-pointer"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isAddressCopied ? 'Copied!' : 'Copy address'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={() => unlinkWallet(account.address)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </React.Fragment>
                    );
                  } else {
                    // For Solana addresses
                    return (
                      <div
                        className="flex items-center justify-between group w-full"
                        key={account.address}
                      >
                        <div className="flex items-center gap-2 w-full justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] leading-none px-1.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
                              SOL
                            </span>
                            <p className="text-sm font-mono">{truncateAddress(account.address)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                                    onClick={() => unlinkWallet(account.address)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete wallet</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => copyAddress(account.address)}
                                  >
                                    <Copy className="h-2 w-2" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isAddressCopied ? 'Copied!' : 'Copy address'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AccountHeading;
