import type { Message } from 'ai';

type AnyToolInvocation = {
  state?: string;
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
};

const isIncompleteToolInvocation = (invocation: AnyToolInvocation | undefined): boolean => {
  if (!invocation) return false;
  if (invocation.state === 'result') return false;
  if (invocation.state === 'call' || invocation.state === 'partial-call') return true;
  // Fallback: treat any invocation without a result as incomplete.
  return invocation.result === undefined;
};

const hasResumeActionAnnotation = (message: Message): boolean => {
  const annotations = (message as any)?.annotations;
  if (!Array.isArray(annotations)) return false;
  return annotations.some((a) => a && typeof a === 'object' && (a as any).resumeAction);
};

const sanitizeMessage = (message: Message): Message | null => {
  const anyMessage = message as any;

  const next: any = { ...anyMessage };

  if (Array.isArray(anyMessage.parts)) {
    next.parts = (anyMessage.parts as any[]).filter((part) => {
      if (!part || part.type !== 'tool-invocation') return true;
      return !isIncompleteToolInvocation(part.toolInvocation as AnyToolInvocation);
    });
  }

  if (Array.isArray(anyMessage.toolInvocations)) {
    next.toolInvocations = (anyMessage.toolInvocations as AnyToolInvocation[]).filter(
      (inv) => !isIncompleteToolInvocation(inv),
    );
  }

  const hasContent =
    typeof next.content === 'string' ? next.content.trim().length > 0 : Boolean(next.content);
  const hasParts = Array.isArray(next.parts) && next.parts.length > 0;
  const hasToolInvocations =
    Array.isArray(next.toolInvocations) && next.toolInvocations.length > 0;
  const hasResumeAction = hasResumeActionAnnotation(next as Message);

  if (!hasContent && !hasParts && !hasToolInvocations && !hasResumeAction) return null;
  return next as Message;
};

/**
 * The Vercel AI SDK requires tool invocations to be paired with results when included in the
 * message history. In-flight tool calls (state="call"/"partial-call") can appear if the user sends
 * a new message while a tool is still running; strip them to prevent request-time 500s.
 */
export const sanitizeMessagesForStreamText = (messages: Message[]): Message[] => {
  return messages.map(sanitizeMessage).filter(Boolean) as Message[];
};
