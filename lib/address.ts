const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const isEvmAddress = (value: string): boolean => {
  if (typeof value !== 'string') return false;
  if (value.length !== 42) return false;
  if (value[0] !== '0') return false;
  const x = value[1];
  if (x !== 'x' && x !== 'X') return false;

  for (let i = 2; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57; // 0-9
    const isLowerHex = code >= 97 && code <= 102; // a-f
    const isUpperHex = code >= 65 && code <= 70; // A-F
    if (!isDigit && !isLowerHex && !isUpperHex) return false;
  }
  return true;
};

export const isSolanaAddressLike = (value: string): boolean => {
  if (typeof value !== 'string') return false;
  if (value.length < 32 || value.length > 44) return false;

  for (let i = 0; i < value.length; i += 1) {
    if (!BASE58_ALPHABET.includes(value[i])) return false;
  }
  return true;
};

export const looksLikeChainAddress = (value: string): boolean =>
  isEvmAddress(value) || isSolanaAddressLike(value);
