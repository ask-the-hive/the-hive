const includesAny = (haystack: string, needles: string[]) => {
  for (const needle of needles) {
    if (haystack.includes(needle)) return true;
  }
  return false;
};

const normalizeLogs = (logs: unknown): string => {
  if (!Array.isArray(logs)) return '';
  const lines: string[] = [];
  for (const entry of logs) {
    if (typeof entry === 'string' && entry.trim()) lines.push(entry.trim());
  }
  return lines.join('\n').toLowerCase();
};

export function toUserFacingSolanaSimulationError(contextMessage: string, logs?: unknown): string {
  const lowerLogs = normalizeLogs(logs);

  // Kamino (KLend) custom error seen when depositing certain mints (commonly Token-2022 / unsupported).
  // Decimal 6090 == hex 0x17ca.
  if (includesAny(lowerLogs, ['custom program error: 0x17ca', 'custom: 6090'])) {
    return `${contextMessage} Next: This token/pool isn’t supported on this lending protocol right now. Try a different pool (e.g. Jupiter Lend) or a different token.`;
  }

  // More specific checks first to avoid misclassifying token-program errors as SOL issues.
  if (includesAny(lowerLogs, ['insufficient funds for rent', 'insufficient lamports'])) {
    return `${contextMessage} Next: Add a little SOL to cover rent (account creation) and fees, then try again.`;
  }

  if (
    includesAny(lowerLogs, [
      // Common SPL-Token / Token-2022 failure strings for "you tried to spend too much".
      'custom program error: 0x1',
      'insufficient funds',
      'insufficient balance',
    ]) &&
    !includesAny(lowerLogs, ['rent', 'lamports', 'insufficient sol'])
  ) {
    return `${contextMessage} Next: Try a slightly smaller amount (sometimes “Max” can fail due to fees/rounding), or swap a bit more of the token, then try again.`;
  }

  if (
    includesAny(lowerLogs, [
      'insufficient sol',
      'insufficient account keys',
    ])
  ) {
    return `${contextMessage} Next: Add a little SOL to cover fees and any needed account creation, then try again.`;
  }

  if (includesAny(lowerLogs, ['blockhash not found', 'transaction expired'])) {
    return `${contextMessage} Next: Try again in a moment (the transaction expired).`;
  }

  if (includesAny(lowerLogs, ['account not found', 'could not find account'])) {
    return `${contextMessage} Next: Try again, and make sure the selected token account exists in your wallet.`;
  }

  return `${contextMessage} Next: Try again in a moment.`;
}
