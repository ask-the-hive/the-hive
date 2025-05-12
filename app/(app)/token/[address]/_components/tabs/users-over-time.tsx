'use client'

import React from 'react'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import { 
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    Skeleton 
} from '@/components/ui';

import { useTokenUsersOverTime } from '@/hooks';
import { useColorMode } from '@/app/_contexts';

interface Props {
    mint: string;
}

const chartConfig = {
    users: {
        label: "Active Users",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

const TokenUsersOverTime: React.FC<Props> = ({ mint }) => {

    const { mode } = useColorMode();

    const { data, isLoading, chain } = useTokenUsersOverTime(mint);

    if (isLoading) return <Skeleton className="h-full w-full" />;

    // Show a message for BSC and Base tokens
    if (chain === 'bsc' || chain === 'base') {
        return (
            <div className="flex items-center justify-center h-full w-full p-4">
                <div className="text-center max-w-md">
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                        Active Wallets Data Not Available
                    </h3>
                    <p className="text-sm text-neutral-500">
                        Active wallets data is currently not available for {chain.toUpperCase()} tokens.
                    </p>
                </div>
            </div>
        );
    }

    if(!data) return <div>No data</div>;

    return (
        <div className="h-full max-h-full overflow-hidden w-full flex flex-col gap-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Users who sent or received tokens on a given day.
            </p>
            <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 24,
                        }}
                    >
                        <CartesianGrid vertical={false} horizontal={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            tickMargin={8}
                            stroke={mode === "dark" ? "#a3a3a3" : "#525252"}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis
                            tickLine={false}
                            tickMargin={8}
                            stroke={mode === "dark" ? "#a3a3a3" : "#525252"}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area
                            dataKey="activeUserCount"
                            name="users"
                            type="natural"
                            fill="#d19900"
                            fillOpacity={0.4}
                            stroke="#d19900"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    )
}

export default TokenUsersOverTime;