import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChainType } from '@/app/_contexts/chain-context';
import ChainIcon from '@/app/(app)/_components/chain-icon';

interface Props {
    chain: ChainType;
    onChainChange: (chain: ChainType) => void;
    disabled?: boolean;
}

const ChainSelector: React.FC<Props> = ({ chain, onChainChange, disabled }) => {
    return (
        <Select
            value={chain}
            onValueChange={(value: ChainType) => onChainChange(value)}
            disabled={disabled}
        >
            <SelectTrigger className="w-fit h-8 text-xs border-0 bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 shadow-none gap-2 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <ChainIcon chain={chain} className="h-4 w-4" />
                        <span>{chain === 'solana' ? 'SOL Agents' : 'BSC Agents'}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="solana" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <ChainIcon chain="solana" className="h-4 w-4" />
                        <span>SOL Agents</span>
                    </div>
                </SelectItem>
                <SelectItem value="bsc" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <ChainIcon chain="bsc" className="h-4 w-4" />
                        <span>BSC Agents</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
};

export default ChainSelector; 