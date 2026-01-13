import { tool } from 'ai';

import { DecisionOutputSchema, type DecisionOutput } from './schema';

const hasDigit = (text: string) => {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= 48 && code <= 57) return true;
  }
  return false;
};

const looksLikeApyClaim = (text: string) => {
  const lower = text.toLowerCase();
  if (text.includes('%')) return true;
  if (!hasDigit(text)) return false;
  return (
    lower.includes('apy') ||
    lower.includes('apr') ||
    lower.includes('percent') ||
    lower.includes('rate')
  );
};

const stripApyNumbers = (text: string) => {
  if (!looksLikeApyClaim(text)) return text;

  const lower = text.toLowerCase();
  const stripPeriods = text.includes('%') || lower.includes('apy') || lower.includes('apr');

  const out: string[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const code = text.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    if (isDigit) continue;
    if (ch === '%') continue;
    if (stripPeriods && ch === '.') continue;
    out.push(ch);
  }

  return out.join('').split(' ').filter(Boolean).join(' ').trim();
};

const sanitizeDecisionOutput = (value: DecisionOutput): DecisionOutput => {
  return {
    ...value,
    primaryRecommendation: stripApyNumbers(value.primaryRecommendation),
    rationale: stripApyNumbers(value.rationale),
    alternatives: undefined,
  };
};

export const decisionResponseTool = tool({
  description:
    'Return a structured recommendation for the UI to render. Use this instead of free-form text when making a decision. Do not include alternatives unless explicitly requested.',
  parameters: DecisionOutputSchema,
  execute: async (args: DecisionOutput) => ({
    message: 'Decision ready',
    body: sanitizeDecisionOutput(args),
  }),
});
