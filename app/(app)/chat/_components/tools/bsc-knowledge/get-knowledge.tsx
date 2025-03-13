import React from 'react'

import ToolCard from '../tool-card';
import { Markdown } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';

import type { ToolInvocation } from 'ai';
import type { GetKnowledgeResultType } from '@/ai/bsc-knowledge/actions/get-knowledge/types';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const GetKnowledge: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Searching knowledge...`}
            result={{
                heading: (result: GetKnowledgeResultType) => result.body?.information 
                    ? `Searched knowledge base` 
                    : `Failed to search knowledge base`,
                body: (result: GetKnowledgeResultType) => {
                    if (!result.body) return "No information found";
                    
                    return (
                        <div className="flex flex-col gap-2">
                            {/* Display the LLM-generated content with embedded links */}
                            <div className={cn(
                                "text-sm markdown-content",
                                // Match the link styles from the main Markdown component
                                "[&_a]:text-brand-500 [&_a]:underline",
                                "[&_a]:hover:opacity-80"
                            )}>
                                <Markdown>
                                    {result.body.information}
                                </Markdown>
                            </div>
                        </div>
                    );
                }
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default GetKnowledge; 