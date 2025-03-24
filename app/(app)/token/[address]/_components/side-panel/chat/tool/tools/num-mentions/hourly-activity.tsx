import React from 'react';
import StatItem from './stat-item';
import StatsSection from './stats-section';
import type { TokenPageNumMentionsResultBodyType } from '@/ai';

interface Props {
    hourlyStats: TokenPageNumMentionsResultBodyType['trendMetrics']['hourlyStats'];
}

const HourlyActivity: React.FC<Props> = ({ hourlyStats }) => {
    const formatNumber = (num: number | null | undefined) => {
        if (num === null || num === undefined) return '0';
        return num.toLocaleString(undefined, {maximumFractionDigits: 2, notation: 'compact'});
    };

    return (
        <StatsSection title="Hourly Activity">
            <StatItem
                label="Peak Hour"
                value={`${formatNumber(hourlyStats.maxHourlyMentions)} mentions at ${hourlyStats.mostActiveHour}`}
            />
            <StatItem
                label="Quietest Hour"
                value={`${formatNumber(hourlyStats.minHourlyMentions)} mentions at ${hourlyStats.quietestHour}`}
            />
            <StatItem
                label="Hourly Average"
                value={hourlyStats.averageHourlyMentions}
                formatter={formatNumber}
                suffix=" mentions"
            />
        </StatsSection>
    );
};

export default HourlyActivity; 