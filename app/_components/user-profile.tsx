'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui'
import { User } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { getUserData } from '@/app/(app)/account/_components/heading/actions'
import { pfpURL } from '@/lib/pfp'
import { useLogin } from '@/hooks'

const UserProfile = () => {
    const { user, ready } = usePrivy();
    const [username, setUsername] = useState<string>('');
    const { login } = useLogin();

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const userData = await getUserData(user.id);
                if (userData) {
                    setUsername(userData.username);
                }
            }
        };
        if (ready && user) {
            fetchUserData();
        }
    }, [ready, user]);

    if (!ready) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl border border-neutral-200 dark:border-neutral-700 p-2">
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="dark:bg-neutral-700">
                            <User className="w-4 h-4" />
                        </AvatarFallback>
                        {user && (
                            <AvatarImage 
                                src={pfpURL(user) || ""}
                            />
                        )}
                    </Avatar>
                    {user ? (
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {username || user.id.replace('did:privy:', '')}
                        </span>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => login()}
                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400"
                        >
                            Login
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserProfile; 