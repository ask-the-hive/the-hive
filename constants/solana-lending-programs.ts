/**
 * Solana Lending Protocol Program IDs
 * These are the on-chain program addresses for various lending protocols
 */

export const LENDING_PROGRAM_IDS = {
  // Kamino Finance - KLend
  'kamino-lend': 'KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD',

  // Jupiter Lend - Multiple programs
  'jupiter-lend-earn': 'jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar',
  'jupiter-lend-liquidity': 'jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC',

  // Marginfi v2
  'marginfi-lending': 'MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA',
  'marginfi-lend': 'MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA',

  // Credix
  credix: 'CRDx2YkdtYtGZXGHZ59wNv1EwKHQndnRc1gT4p8i2vPX',

  // Maple - syrupUSDC Pool (Crosschain CCIP)
  // Docs: https://docs.maple.finance/integrate/syrupusd-crosschain#solana
  maple: 'HrTBpF3LqSxXnjnYdR4htnBLyMHNZ6eNaDZGPundvHbm',

  // Save (formerly Solend) - Lending Program
  // Docs: https://docs.save.finance/architecture/addresses
  save: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
} as const;

export type LendingProtocolKey = keyof typeof LENDING_PROGRAM_IDS;

/**
 * Get program ID for a lending protocol
 */
export function getLendingProgramId(protocol: string): string | null {
  const key = protocol.toLowerCase() as LendingProtocolKey;
  return LENDING_PROGRAM_IDS[key] || null;
}
