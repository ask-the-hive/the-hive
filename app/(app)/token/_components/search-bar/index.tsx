import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useChain, ChainType } from '@/app/_contexts/chain-context';
import { Input } from '@/components/ui/input';
import { useSearchTokens } from '@/hooks/queries/token';

const SearchBar: React.FC = () => {
    const [input, setInput] = React.useState('');
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    
    // Use URL param if available, otherwise use context
    const chainParam = searchParams.get('chain') as ChainType | null;
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;

    // Call useSearchTokens to keep the search functionality working
    useSearchTokens(input, chain);

    return (
        <div className="w-full">
            <Input
                type="text"
                placeholder="Search tokens..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full"
            />
        </div>
    );
};

export default SearchBar; 