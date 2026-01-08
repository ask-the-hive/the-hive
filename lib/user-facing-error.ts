export type UserFacingErrorInfo = {
  title: string;
  message: string;
  nextSteps: string[];
};

const normalize = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).trim();
  }

  const message = (value as any)?.message;
  if (typeof message === 'string') return message.trim();

  return '';
};

const isWordChar = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    char === '_' // underscore
  );
};

const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  let current = '';

  for (let idx = 0; idx < text.length; idx += 1) {
    const char = text[idx];
    if (isWordChar(char)) {
      current += char;
      continue;
    }
    if (current) {
      tokens.push(current);
      current = '';
    }
  }

  if (current) tokens.push(current);
  return tokens;
};

const includesAny = (lower: string, needles: string[]) => {
  for (const n of needles) {
    if (lower.includes(n)) return true;
  }
  return false;
};

const hasHttpLikeStatusCode = (text: string) => {
  const tokens = tokenize(text);
  for (const t of tokens) {
    if (t.length !== 3) continue;
    let n = 0;
    for (let i = 0; i < 3; i += 1) {
      const code = t.charCodeAt(i);
      if (code < 48 || code > 57) {
        n = -1;
        break;
      }
      n = n * 10 + (code - 48);
    }
    if (n >= 400 && n <= 599) return true;
  }
  return false;
};

const hasExactStatusCode = (text: string, code: number) => {
  const tokens = tokenize(text);
  for (const t of tokens) {
    if (t.length !== 3) continue;
    let n = 0;
    for (let i = 0; i < 3; i += 1) {
      const c = t.charCodeAt(i);
      if (c < 48 || c > 57) {
        n = -1;
        break;
      }
      n = n * 10 + (c - 48);
    }
    if (n === code) return true;
  }
  return false;
};

const looksLikeStackFrame = (lower: string) => {
  // Basic, regex-free detection for lines like: "at foo (file.ts:12:34)"
  const atIdx = lower.indexOf(' at ');
  if (atIdx === -1) return false;
  // Look for ":<digits>:<digits>" after " at "
  const slice = lower.slice(atIdx + 4);
  const firstColon = slice.indexOf(':');
  if (firstColon === -1) return false;
  const secondColon = slice.indexOf(':', firstColon + 1);
  if (secondColon === -1) return false;

  const isDigits = (s: string) => {
    if (!s) return false;
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i);
      if (c < 48 || c > 57) return false;
    }
    return true;
  };

  const afterFirst = slice.slice(firstColon + 1, secondColon);
  const afterSecondRaw = slice.slice(secondColon + 1);
  let end = afterSecondRaw.length;
  for (let i = 0; i < afterSecondRaw.length; i += 1) {
    const c = afterSecondRaw.charCodeAt(i);
    if (c < 48 || c > 57) {
      end = i;
      break;
    }
  }
  const afterSecond = afterSecondRaw.slice(0, end);

  return isDigits(afterFirst) && isDigits(afterSecond);
};

const looksTechnical = (text: string) => {
  const lower = text.toLowerCase();

  if (
    includesAny(lower, [
      'typeerror',
      'referenceerror',
      'syntaxerror',
      'aggregateerror',
      'fetcherror',
      'econn',
      'enotfound',
      'eai_again',
      'etimedout',
      'econnreset',
      'internal server error',
      'server error',
      'jsonrpc',
      'rpc',
      'raydium_api',
      'raydiumapi',
      'status code',
      'http ',
      'error:',
    ])
  ) {
    return true;
  }

  if (hasHttpLikeStatusCode(text)) return true;
  if (looksLikeStackFrame(lower)) return true;

  return false;
};

export function getUserFacingErrorInfo(error: unknown): UserFacingErrorInfo {
  const message = normalize((error as any)?.message || error);
  const lower = message.toLowerCase();

  if (!message) {
    return {
      title: 'Something went wrong',
      message: "We couldn't complete that request.",
      nextSteps: ['Try again in a moment.'],
    };
  }

  if (includesAny(lower, ['rate limit', 'too many requests']) || hasExactStatusCode(message, 429)) {
    return {
      title: 'Too many requests',
      message: "We're being rate-limited by a data provider, so live data may not load right now.",
      nextSteps: ['Wait 30–60 seconds and try again.'],
    };
  }

  if (
    includesAny(lower, [
      'network',
      'fetch failed',
      'failed to fetch',
      'timeout',
      'timed out',
      'econn',
      'enotfound',
      'etimedout',
      'eai_again',
    ])
  ) {
    return {
      title: 'Connection issue',
      message: "We couldn't reach the network to load this data.",
      nextSteps: ['Check your connection and try again.', 'If it keeps failing, try again later.'],
    };
  }

  if (
    includesAny(lower, ['unauthorized', 'forbidden']) ||
    hasExactStatusCode(message, 401) ||
    hasExactStatusCode(message, 403)
  ) {
    return {
      title: 'Sign-in required',
      message: "You're not authorized to do that yet.",
      nextSteps: ['Connect your wallet or sign in, then try again.'],
    };
  }

  if (includesAny(lower, ['invalid public key', 'invalid wallet', 'invalid address'])) {
    return {
      title: 'Invalid address',
      message: "That wallet address doesn't look valid.",
      nextSteps: ['Double-check the address and try again.'],
    };
  }

  if (includesAny(lower, ['internal server error', 'server error'])) {
    return {
      title: 'Something went wrong',
      message: "We hit an unexpected issue on our side. It's not your fault.",
      nextSteps: ['Try again in a moment.', 'If it keeps happening, try again later.'],
    };
  }

  if (!looksTechnical(message)) {
    return {
      title: 'Something went wrong',
      message,
      nextSteps: ['Try again.'],
    };
  }

  return {
    title: 'Something went wrong',
    message: "We hit an unexpected issue while loading this. It's not your fault.",
    nextSteps: ['Try again.', 'If it keeps happening, try again later.'],
  };
}

export function toUserFacingErrorText(error: unknown): string {
  const info = getUserFacingErrorInfo(error);
  const steps = info.nextSteps.length ? ` Next: ${info.nextSteps.join(' ')}` : '';
  return `${info.message}${steps}`;
}

/**
 * Like `toUserFacingErrorText`, but prefers a custom context message when the
 * underlying error looks technical and we only have a generic classification.
 */
export function toUserFacingErrorTextWithContext(contextMessage: string, error: unknown): string {
  const original = normalize((error as any)?.message || error);
  const info = getUserFacingErrorInfo(error);

  if (!original) return toUserFacingErrorText(contextMessage);
  if (!looksTechnical(original)) return toUserFacingErrorText(error);

  const message = info.title === 'Something went wrong' ? contextMessage : info.message;
  const steps = info.nextSteps.length ? ` Next: ${info.nextSteps.join(' ')}` : '';
  return `${message}${steps}`;
}

export function sanitizeUserVisibleMessage(message: unknown): string {
  const text = normalize(message);
  if (!text) return '';
  if (!looksTechnical(text)) return text;
  return toUserFacingErrorText(text);
}
