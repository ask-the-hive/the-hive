'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';

import { cn } from '@/lib/utils';

import type { DecisionOutput } from '@/ai/ui/decision-response/schema';

type Props = {
  tool: ToolInvocation;
  className?: string;
};

const getDecisionBody = (tool: ToolInvocation): DecisionOutput | null => {
  if (tool.state !== 'result') return null;
  if (!('result' in tool)) return null;
  return (tool.result?.body as DecisionOutput | undefined) ?? null;
};

const DecisionResponseTool: React.FC<Props> = ({ tool, className }) => {
  const decision = getDecisionBody(tool);

  if (tool.state === 'partial-call') {
    return null;
  }

  if (!decision) return null;

  return (
    <div className={cn('flex flex-col gap-1 text-sm leading-relaxed', className)}>
      <p className="font-medium text-foreground">{decision.primaryRecommendation}</p>
      <p className="text-muted-foreground">{decision.rationale}</p>
    </div>
  );
};

export default DecisionResponseTool;
