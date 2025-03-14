export const truncateAddress = (address: string | undefined | null) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
}