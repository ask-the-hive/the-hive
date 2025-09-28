/**
 * Capitalizes words in a string, replacing hyphens with spaces
 * @param str The string to capitalize
 * @returns Capitalized string with spaces instead of hyphens
 */
export function capitalizeWords(str: string): string {
  return str
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert binnedConfidence (0-3) to confidence level label
 * @param binValue The confidence bin value (0-3)
 * @returns Human-readable confidence label
 */
export function getConfidenceLabel(binValue: number): string {
  switch (binValue) {
    case 3:
      return 'High';
    case 2:
      return 'Medium';
    case 1:
      return 'Low';
    case 0:
      return 'Very Low';
    default:
      return 'Unknown';
  }
}
