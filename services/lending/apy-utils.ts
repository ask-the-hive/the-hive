/** @notice Normalize APY values that may be provided as decimals, percents, or basis points. */
export const normalizeApy = (raw: number): number => {
  if (!isFinite(raw) || raw <= 0) return 0;
  if (raw > 100) return raw / 100;
  if (raw > 10) return raw;
  if (raw > 1) return raw;
  return raw * 100;
};
