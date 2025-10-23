import React from 'react';

import Address from '@/app/_components/address';
import { ChartPie } from 'lucide-react';

interface Props {
  address: string;
}

const Header: React.FC<Props> = ({ address }) => {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ChartPie className="h-6 w-6" />
          <h1 className="text-2xl font-bold leading-none">Portfolio</h1>
        </div>
        <Address address={address} />
      </div>
    </div>
  );
};

export default Header;
