'use client'

import React, { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage, Card, Separator, Button } from '@/components/ui';
import { LogOut } from 'lucide-react';

import Address from '@/app/_components/address';

import { type User } from '@privy-io/react-auth';
import { useLogin } from '@/hooks';
import ChangePfp from './change-pfp';
import { Loader2 } from 'lucide-react';
import { pfpURL } from '@/lib/pfp';

interface Props {
    user: User
}

const AccountHeading: React.FC<Props> = ({ user }) => {

    const [isUploading, setIsUploading] = useState<boolean>(false);
    const { logout } = useLogin();

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
                        <Avatar
                            className="w-12 h-12 dark:bg-neutral-700"
                        >
                            <AvatarFallback className="dark:bg-neutral-700">
                                {
                                    isUploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        user.wallet?.address.slice(0, 2)
                                    )
                                }
                            </AvatarFallback>
                            <AvatarImage 
                                src={pfpURL(user)}
                            />
                        </Avatar>
                        <div className="flex flex-col">
                            {
                                user.wallet ? (
                                    <Address 
                                        address={user.wallet.address}
                                        className="text-md font-bold"
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground">No wallet connected</p>
                                )
                            }
                            <p className="text-xs text-neutral-500">
                                Joined on {user.createdAt.toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <ChangePfp user={user} isUploading={isUploading} setIsUploading={setIsUploading} />
                </div>
                <Separator />
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">User ID</p>
                    <p className="text-sm">{user.id.slice(10)}</p>
                </div>
                <Separator />
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Connected Wallet</p>
                    {
                        user.linkedAccounts.filter((account) => account.type === 'wallet').map((account) => (
                            <p className="text-sm" key={account.address}>{account.address}</p>
                        ))
                    }
                </div>
            </Card>
        </div>
    )
}

export default AccountHeading;