export const formatPercent = (value: number): string => {
    const formatted = value.toFixed(2);
    return `${formatted}%`;
}; 