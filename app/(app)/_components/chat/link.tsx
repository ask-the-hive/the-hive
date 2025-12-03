'use client';

import React from 'react';
import Image from 'next/image';
import { useKnowledgeByUrl } from '@/hooks';

interface Props {
  url: string;
  children: React.ReactNode;
}

const Link: React.FC<Props> = ({ url, children }) => {
  const { data, isLoading } = useKnowledgeByUrl(url);

  if (isLoading) return children;

  if (data)
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <span className="bg-brand-600/70 rounded-md px-2 py-1 w-fit inline-flex items-center gap-2 hover:bg-brand-600/90 transition-colors text-sm">
          {data.favicon && (
            <Image
              src={data.favicon}
              alt={data.name}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
              unoptimized
            />
          )}
          {data.name}
        </span>
      </a>
    );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 hover:underline"
    >
      {children}
    </a>
  );
};

export default Link;
