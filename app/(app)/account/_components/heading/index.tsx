'use client'

import React, { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage, Separator, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { LogOut, Upload, User } from 'lucide-react';

import Address from '@/app/_components/address';

import { type User as PrivyUser } from '@privy-io/react-auth';
import { useLogin } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';
import { Loader2 } from 'lucide-react';
import { pfpURL } from '@/lib/pfp';
import { uploadImage } from '@/services/storage';

interface Props {
    user: PrivyUser
}

const AccountHeading: React.FC<Props> = ({ user }) => {

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [copied, setCopied] = useState(false);
    const { logout } = useLogin();
    const { walletAddresses } = useChain();

    // Helper function to determine wallet chain
    const getWalletChain = (address: string) => {
        if (address.startsWith('0x')) {
            return 'BSC';
        } else {
            return 'SOL';
        }
    };

    // Format user ID by removing the 'did:privy:' prefix
    const formatUserId = (id: string) => {
        return id.replace('did:privy:', '');
    };

    // Get the formatted user ID
    const formattedUserId = formatUserId(user.id);

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
    const handleCopyUserId = () => {
        navigator.clipboard.writeText(formattedUserId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Account</h1>
                <Button 
                    variant="ghost" 
                    onClick={() => logout()}
                    className="gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Log out
                </Button>
            </div>
            <Card className="flex flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <div className="flex flex-row gap-2 items-center">
                        <div className="relative group">
                            <Avatar
                                className="w-12 h-12 dark:bg-neutral-700 cursor-pointer"
                            >
                                <AvatarFallback className="dark:bg-neutral-700">
                                    {
                                        isUploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <User className="w-6 h-6" />
                                        )
                                    }
                                </AvatarFallback>
                                <AvatarImage 
                                    src={pfpURL(user) || ""}
                                />
                            </Avatar>
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <label htmlFor="profile-upload" className="cursor-pointer w-full h-full flex items-center justify-center">
                                    <Upload className="h-4 w-4 text-white" />
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
                        <div className="flex flex-col">
                            {/* Clickable user ID with copy functionality */}
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p 
                                            className="text-md font-bold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-1 rounded transition-colors"
                                            onClick={handleCopyUserId}
                                        >
                                            {formattedUserId}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {copied ? "Copied!" : "Copy to clipboard"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <p className="text-xs text-neutral-500">
                                Joined on {user.createdAt.toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">User ID</p>
                    <p className="text-sm">{formattedUserId}</p>
                </div>
                <Separator />
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Connected Wallets</p>
                    {
                        user.linkedAccounts.filter((account) => account.type === 'wallet').map((account) => (
                            <div className="flex items-center gap-2" key={account.address}>
                                <span className="text-[10px] leading-none px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
                                    {getWalletChain(account.address)}
                                </span>
                                <p className="text-sm">{account.address}</p>
                            </div>
                        ))
                    }
                </div>
            </Card>
        </div>
    )
}

export default AccountHeading;