import React from 'react';
import Image from 'next/image';
import { FaDiscord, FaTelegram, FaXTwitter } from 'react-icons/fa6';
import { Globe } from 'lucide-react';
import { OptionalLink } from '@/components/ui/optional-link';
import { cn } from '@/lib/utils';

import type { TokenOverview } from '@/services/birdeye/types/token-overview';

const SOCIAL_LINKS = [
    {
        id: 'website',
        icon: <Globe className="h-4 w-4" />
    },
    {
        id: 'twitter',
        icon: <FaXTwitter className="h-4 w-4" />
    },
    {
        id: 'coingeckoId',
        icon: (
            <Image 
                src="/logos/coingecko.png" 
                alt="Coingecko" 
                width={16} 
                height={16} 
                className="h-4 w-4"
            />
        )
    },
    {
        id: 'discord',
        icon: <FaDiscord className="h-4 w-4" />
    },
    {
        id: 'telegram',
        icon: <FaTelegram className="h-4 w-4" />
    }
] as const;

interface Props {
    token: TokenOverview
}

const Links: React.FC<Props> = ({ token }) => {
    return (
        <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((link) => (
                <OptionalLink 
                    key={link.id}
                    href={(link.id === "coingeckoId" && token?.extensions?.[link.id]) 
                        ? `https://www.coingecko.com/en/coins/${token.extensions?.[link.id]}` 
                        : token?.extensions?.[link.id]} 
                    target="_blank"
                >
                    <div 
                        className={cn(
                            "p-1",
                            token?.extensions?.[link.id] ? "hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full" : "opacity-25"
                        )}
                    >
                        {link.icon}
                    </div>
                </OptionalLink>
            ))}
        </div>
    )
}

export default Links; 