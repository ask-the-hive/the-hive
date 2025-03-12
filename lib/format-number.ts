/**
 * Formats a number with commas as thousand separators and a fixed number of decimal places.
 * @param value The number to format
 * @param decimals The number of decimal places to show (default: 2)
 * @returns The formatted number as a string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0';
  
  // Handle very small numbers
  if (Math.abs(value) < 0.01) {
    return value.toExponential(decimals);
  }

  // Format with commas and fixed decimal places
  const parts = value.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
} 