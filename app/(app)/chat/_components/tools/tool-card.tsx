import React from 'react'

import { 
    AnimatedShinyText, 
    Collapsible, 
    CollapsibleTrigger, 
    CollapsibleContent, 
    Icon 
} from '@/components/ui'

import { cn } from '@/lib/utils'

import type { ToolInvocation } from 'ai'
import type { BaseActionResult } from '@/ai'
import { getAgentIcon, getAgentName } from './tool-to-agent'
import { ChevronDown } from 'lucide-react'

interface Props<ActionResultBodyType, ActionArgsType> {
    tool: ToolInvocation,
    loadingText: string,
    result: {
        heading: (result: BaseActionResult<ActionResultBodyType>) => string,
        body: (result: BaseActionResult<ActionResultBodyType>) => React.ReactNode,
    },
    call?: {
        heading: string,
        body: (toolCallId: string, args: ActionArgsType) => React.ReactNode,
    },
    defaultOpen?: boolean,
    className?: string,
    prevToolAgent?: string,
    inputDisabledMessage?: string,
}

const ToolCard = <ActionResultBodyType, ActionArgsType>({ tool, loadingText, result, call, defaultOpen = true, className, prevToolAgent, inputDisabledMessage }: Props<ActionResultBodyType, ActionArgsType>) => {

    const agentName = getAgentName(tool);

    const agentIcon = getAgentIcon(agentName);
    
    return (
        <div className={cn(
            "flex flex-col gap-2 w-fit",
            className
        )}>
            <div className={cn(
                "flex items-center gap-2",
                prevToolAgent === agentName && "hidden"
            )}>
                {
                    tool.state === "result"
                        ? (tool.result.body 
                            ? <Icon name={agentIcon} className="w-4 h-4 text-brand-600 dark:text-brand-600" />
                            : <Icon name="X" className="w-4 h-4 text-red-500 dark:text-red-400" />)
                        : <Icon name={agentIcon} className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                }
                <p className="text-sm md:text-lg font-bold">{agentName}</p>
            </div>
            <div>
                {
                    tool.state === "partial-call" ? (
                        <AnimatedShinyText
                            className="text-sm"
                        >
                            {loadingText}
                        </AnimatedShinyText>
                    ) : (
                        tool.state === "call" ? (
                            call?.body 
                                ? (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">{call.heading}</p>
                                        {call.body(tool.toolCallId, tool.args)}
                                    </div>
                                ) 
                                : (
                                    <AnimatedShinyText
                                        className="text-sm"
                                    >
                                        {loadingText}
                                    </AnimatedShinyText>
                                )
                        ) : (
                            <Collapsible defaultOpen={defaultOpen}>
                                <CollapsibleTrigger 
                                    className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:underline"
                                >
                                    <p className="text-sm">{result.heading(tool.result)}</p>
                                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="text-sm pt-2">
                                    {result.body(tool.result)}
                                </CollapsibleContent>
                            </Collapsible>
                        )
                    )
                }
            </div>
        </div>
    )
}

export default ToolCard