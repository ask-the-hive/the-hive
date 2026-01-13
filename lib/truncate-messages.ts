const estimateTokens = (value: unknown) => {
  const content = typeof value === 'string' ? value : String(value ?? '');
  // Rough token estimation: 4 chars ≈ 1 token
  return Math.ceil(content.length / 4);
};

export const truncateMessagesToMaxTokens = <T>(messages: T[], maxTokens: number): T[] => {
  let tokenCount = 0;
  const truncatedMessages: T[] = [];

  // Process messages from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const content = (msg as any)?.content;
    const estimatedTokens = estimateTokens(content);

    if (tokenCount + estimatedTokens <= maxTokens) {
      truncatedMessages.unshift(msg);
      tokenCount += estimatedTokens;
    } else {
      break;
    }
  }

  return truncatedMessages;
};
