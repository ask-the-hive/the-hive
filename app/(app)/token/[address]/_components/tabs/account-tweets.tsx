"use client";

import React from 'react'

import { Separator, Skeleton } from '@/components/ui';

import Tweet from '@/app/_components/tweet';

import { useAccountTweets } from '@/hooks';

interface Props {
    username: string;
}

const AccountTweets: React.FC<Props> = ({ username }) => {

    const { data: tweets, isLoading } = useAccountTweets(username);

    return (
        <div className="flex flex-col gap-2 h-full max-h-full overflow-y-hidden">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
                <div className="flex flex-col gap-2 flex-1 h-0 overflow-y-auto no-scrollbar">
                    {tweets.map((tweet) => (
                        <React.Fragment key={tweet.tweet.id}>
                            <Tweet 
                                tweet={tweet} 
                            />
                            <Separator />
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AccountTweets;