'use client';

import React from 'react';
import Image from 'next/image';
import ChatInput from './input';
import StarterButtons from './starter-buttons';
import { cn } from '@/lib/utils';
import type { TokenChatData } from '@/types';

interface Props {
  token: TokenChatData;
}

const EmptyChat: React.FC<Props> = ({ token }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center w-full h-full px-4')}>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-4">
        <div className="flex flex-col gap-4 items-center justify-center">
          <Image
            src={token.logoURI || 'https://www.birdeye.so/images/unknown-token-icon.svg'}
            alt={token.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover"
            unoptimized
          />
          <h1 className="font-semibold text-center text-md">
            What would you like to know about{' '}
            <span className="text-brand-600 font-bold inline">{token.name}</span>?
          </h1>
        </div>
        <ChatInput />
        <StarterButtons />
      </div>
    </div>
  );
};

export default EmptyChat;
