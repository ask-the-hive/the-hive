import React from 'react';

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui';

import { Icon } from '@/components/ui/icon';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

import { cn } from '@/lib/utils';

import type { ToolInvocation } from 'ai';
import type { BaseActionResult } from '@/ai';
import { getAgentIcon, getAgentName } from './tool-to-agent';
import { ChevronDown } from 'lucide-react';

interface Props<ActionResultBodyType, ActionArgsType> {
  tool: ToolInvocation;
  loadingText: string;
  result: {
    heading: (result: BaseActionResult<ActionResultBodyType>) => string | null;
    body: (result: BaseActionResult<ActionResultBodyType>) => React.ReactNode;
  };
  call?: {
    heading: string;
    body: (toolCallId: string, args: ActionArgsType) => React.ReactNode;
  };
  defaultOpen?: boolean;
  disableCollapseAnimation?: boolean;
  className?: string;
  prevToolAgent?: string;
  hideCollapsible?: boolean;
}

const ToolCard = <ActionResultBodyType, ActionArgsType>({
  tool,
  loadingText,
  result,
  call,
  defaultOpen = true,
  className,
  prevToolAgent,
  disableCollapseAnimation = false,
}: Props<ActionResultBodyType, ActionArgsType>) => {
  const agentName = getAgentName(tool);

  const agentIcon = getAgentIcon(agentName);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className={cn('flex items-center gap-2', prevToolAgent === agentName && 'hidden')}>
        {tool.state === 'result' ? (
          'result' in tool && tool.result.body ? (
            <Icon name={agentIcon} className="w-4 h-4 text-brand-600 dark:text-brand-600" />
          ) : (
            <Icon name="X" className="w-4 h-4 text-red-500 dark:text-red-400" />
          )
        ) : (
          <Icon name={agentIcon} className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
        )}
        <p className="text-sm md:text-lg font-bold">{agentName}</p>
      </div>
      <div>
        {tool.state === 'partial-call' ? (
          <AnimatedShinyText className="text-sm">{loadingText}</AnimatedShinyText>
        ) : tool.state === 'call' ? (
          call?.body ? (
            <div className="flex flex-col gap-2">
              {/* <p className="text-lg text-neutral-600 dark:text-neutral-400 font-bold">
                {call.heading}
              </p> */}
              {call.body(tool.toolCallId, tool.args)}
            </div>
          ) : (
            <AnimatedShinyText className="text-sm">{loadingText}</AnimatedShinyText>
          )
        ) : (
          (() => {
            const headingResult = 'result' in tool ? result.heading(tool.result) : null;
            const bodyResult = 'result' in tool ? result.body(tool.result) : null;
            const hasBodyContent = bodyResult !== null && bodyResult !== undefined;

            return (
              headingResult && (
                <Collapsible defaultOpen={hasBodyContent ? defaultOpen : false}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:underline">
                    <p className="text-sm">{headingResult}</p>
                    {hasBodyContent && (
                      <ChevronDown className="w-4 h-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    )}
                  </CollapsibleTrigger>
                  {hasBodyContent && (
                    <CollapsibleContent
                      className="text-sm pt-2"
                      disableAnimation={disableCollapseAnimation}
                    >
                      {bodyResult}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              )
            );
          })()
        )}
      </div>
    </div>
  );
};

export default ToolCard;
