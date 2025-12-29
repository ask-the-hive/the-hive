export type UserFacingErrorInfo = {
  title: string;
  message: string;
  nextSteps: string[];
};

const normalize = (value: unknown) => String(value ?? '').trim();

const looksTechnical = (text: string) =>
  /\b(TypeError|ReferenceError|SyntaxError|AggregateError|FetchError)\b/.test(text) ||
  /\b(ECONN|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET)\b/.test(text) ||
  /\binternal server error\b/i.test(text) ||
  /\bserver error\b/i.test(text) ||
  /\b(rpc|jsonrpc|raydium_api|raydium_?api)\b/i.test(text) ||
  /\b(4\d{2}|5\d{2})\b/.test(text) ||
  /\b(status\s*code\s*\d{3}|http\s*\d{3})\b/i.test(text) ||
  /\bat\s.+:\d+:\d+/.test(text) ||
  /\bError:\b/.test(text);

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

  if (/rate limit|too many requests|429/.test(lower)) {
    return {
      title: 'Too many requests',
      message: "We're being rate-limited by a data provider, so live data may not load right now.",
      nextSteps: ['Wait 30–60 seconds and try again.'],
    };
  }

  if (
    /network|fetch failed|failed to fetch|timeout|timed out|econn|enotfound|etimedout|eai_again/.test(
      lower,
    )
  ) {
    return {
      title: 'Connection issue',
      message: "We couldn't reach the network to load this data.",
      nextSteps: ['Check your connection and try again.', 'If it keeps failing, try again later.'],
    };
  }

  if (/unauthorized|forbidden|401|403/.test(lower)) {
    return {
      title: 'Sign-in required',
      message: "You're not authorized to do that yet.",
      nextSteps: ['Connect your wallet or sign in, then try again.'],
    };
  }

  if (/invalid public key|invalid wallet|invalid address/.test(lower)) {
    return {
      title: 'Invalid address',
      message: "That wallet address doesn't look valid.",
      nextSteps: ['Double-check the address and try again.'],
    };
  }

  if (/internal server error|server error/.test(lower)) {
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

export function sanitizeUserVisibleMessage(message: unknown): string {
  const text = normalize(message);
  if (!text) return '';
  if (!looksTechnical(text)) return text;
  return toUserFacingErrorText(text);
}
