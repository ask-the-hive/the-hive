export const formatPercent = (value: number): string => {
  const formatted = value.toFixed(2);
  return `${formatted}%`;
};

/**
 * Formats a fiat value from raw token balance, price, and decimals
 * @param rawBalance Raw token balance (e.g., 1000000000 for 1 SOL with 9 decimals)
 * @param price Current token price in USD
 * @param decimals Token decimals
 * @returns Formatted fiat string (e.g., "$1,234.56")
 */
export const formatFiat = (
  rawBalance: string | number,
  price: number,
  decimals: number,
): string => {
  if (!rawBalance || !price || price <= 0) return '$0.00';

  const balance = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
  if (isNaN(balance) || balance <= 0) return '$0.00';

  const actualBalance = balance / Math.pow(10, decimals);
  const fiatValue = actualBalance * price;

  return `$${fiatValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats a crypto balance from raw balance, symbol, and decimals
 * @param rawBalance Raw token balance (e.g., 1000000000 for 1 SOL with 9 decimals)
 * @param symbol Token symbol (e.g., "SOL", "USDC")
 * @param decimals Token decimals
 * @returns Formatted crypto string (e.g., "1.2345 SOL")
 */
export const formatCrypto = (
  rawBalance: string | number,
  symbol: string,
  decimals: number,
): string => {
  if (!rawBalance) return `0 ${symbol}`;

  const balance = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
  if (isNaN(balance) || balance <= 0) return `0 ${symbol}`;

  const actualBalance = balance / Math.pow(10, decimals);

  // For very small amounts, show more decimals
  const maxDecimals = actualBalance < 0.01 ? 8 : 4;

  return `${actualBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })} ${symbol}`;
};

/**
 * Formats large numbers into compact notation (e.g., $348M, $1.2B)
 * @param value The number to format
 * @returns Formatted string with appropriate suffix
 */
export const formatCompactNumber = (value: number): string => {
  if (value === 0) return '$0';

  const absValue = Math.abs(value);

  if (absValue >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `$${(value / 1e6).toFixed(0)}M`;
  } else if (absValue >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};
