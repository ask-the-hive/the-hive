import { Message } from 'ai';

const basePrompt = `Generate 3 follow-up suggestions for what I can do next. They can be declarative or questions. The prompts should be specific to the previous messages. Reference specific tokens, projects, etc.`;

const stakingPrompt = `${basePrompt}

If the conversation is about liquid staking or staking yields, consider suggesting educational topics like:
- "Learn about liquid staking"
- "Risks of liquid staking"
- "How yield is received"
- "What are liquid staking tokens"

Make the suggestions relevant to the current context and user's needs.`;

export const determineSuggestionsPrompt = (messages: Message[]): string => {
  // Check if the last message contains staking-related tools
  const lastMessage = messages[messages.length - 1];
  const hasStakingTools = lastMessage?.parts?.some(
    (part) =>
      part.type === 'tool-invocation' &&
      (part.toolInvocation.toolName.includes('staking') ||
        part.toolInvocation.toolName.includes('stake') ||
        part.toolInvocation.toolName.includes('unstake')),
  );

  if (hasStakingTools) {
    return stakingPrompt;
  }

  return basePrompt;
};
