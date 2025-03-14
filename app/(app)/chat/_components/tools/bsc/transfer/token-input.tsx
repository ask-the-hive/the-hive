import React from 'react'
import { cn } from '@/lib/utils'
import TokenSelect from '@/app/_components/token-select'
import TokenDisplay from '@/app/_components/token-display'
import type { Token } from '@/db/types'

interface Props {
    label: string,
    amount: string,
    onChange?: (amount: string) => void,
    token: Token | null,
    onChangeToken?: (token: Token | null) => void,
    priorityTokens?: string[]
}

const TokenInput: React.FC<Props> = ({ label, amount, onChange, token, onChangeToken, priorityTokens }) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <div className={cn(
            "flex flex-col border border-transparent rounded-md p-2 w-full transition-colors bg-neutral-100 dark:bg-neutral-700 gap-2",
            isFocused && "border-brand-600"
        )}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                    {label}
                </p>
            </div>
            <div className={cn(
                "flex items-center w-full",
            )}>
                <div className="w-full">
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => onChange && onChange(e.target.value)} 
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={!onChange}
                        placeholder="0.00"
                    />
                </div>
                {
                    onChangeToken ? (
                        <TokenSelect
                            value={token}
                            onChange={onChangeToken}
                            priorityTokens={priorityTokens}
                        />
                    ) : (
                        token && (
                            <TokenDisplay token={token} />
                        )
                    )
                }
            </div>
        </div>
    )
}

export default TokenInput 