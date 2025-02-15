'use client'

import React from 'react'
import '@/components/utils/suppress-console'
import { usePrivy } from '@privy-io/react-auth';
import { Skeleton } from '@/components/ui';
import NotLoggedInAlert from '../../chat/_components/not-logged-in-alert';
import AccountHeading from './heading';
import ConnectedAccounts from './connected-accounts';

const Account: React.FC = () => {

    const { user, ready } = usePrivy();

    if(!ready) return <Skeleton className="h-full w-full" />;

    return (
        <>
            <div className="flex flex-col max-w-2xl mx-auto gap-4">
                {user && (
                    <>
                        <AccountHeading user={user} />
                        <ConnectedAccounts user={user} />
                    </>
                )}
            </div>
            <NotLoggedInAlert />
        </>
    )
}

export default Account