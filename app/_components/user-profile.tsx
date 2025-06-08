'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui'
import { User, LogOut } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { getUserData } from '@/app/(app)/account/_components/heading/actions'
import { pfpURL } from '@/lib/pfp'
import { useLogin } from '@/hooks'

const UserProfile = () => {
    const { user, ready, authenticated } = usePrivy();
    const [username, setUsername] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { login, logout } = useLogin();

    useEffect(() => {
        setIsLoggedIn(authenticated && !!user);
    }, [authenticated, user]);

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

    const handleLogout = async () => {
        setIsLoggedIn(false);
        await logout();
    };

    if (!ready) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center h-14 px-2">
                    <div className="flex items-center gap-2">
                        <Avatar key={isLoggedIn ? 'logged-in' : 'logged-out'} className="w-8 h-8">
                            <AvatarFallback className="dark:bg-neutral-700">
                                <User className="w-4 h-4" />
                            </AvatarFallback>
                            {isLoggedIn && user?.id && pfpURL(user) && (
                                <AvatarImage 
                                    src={pfpURL(user)}
                                    alt={username || user.id.replace('did:privy:', '')}
                                />
                            )}
                        </Avatar>
                        {isLoggedIn && user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[12ch] truncate">
                                    {username || user.id.replace('did:privy:', '')}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
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
        </div>
    )
}

export default UserProfile; 