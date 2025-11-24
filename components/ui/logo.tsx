import React from 'react';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const Logo: React.FC<Props> = ({ className, showText = false, textClassName }) => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Logo"
        width={100}
        height={100}
        className={cn('w-10 h-10', className)}
      />
      {showText && <h3 className={cn('text-lg font-bold', textClassName)}>The Hive</h3>}
    </div>
  );
};

export default Logo;
