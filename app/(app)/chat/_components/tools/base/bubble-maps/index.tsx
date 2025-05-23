import React from 'react';

import ToolCard from '../../tool-card';

import BubbleMapsCallBody from './call-body';
import BubbleMapsResult from './result';

import type { ToolInvocation } from 'ai';
import type { BubbleMapsResultType } from '@/ai/base/actions/token/bubble-maps/types';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const BubbleMaps: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText="Generating bubble map..."
            result={{
                heading: (result: BubbleMapsResultType) => result.body 
                    ? "Bubble Maps Complete"
                    : "Failed to Get Bubble Maps",
                body: (result: BubbleMapsResultType) => result.body && result.body.success
                    ? <BubbleMapsResult url={result.body.url} />
                    : result.message
            }}
            call={{
                heading: "Get Bubble Maps",
                body: (toolCallId: string, args: any) => (
                    <BubbleMapsCallBody toolCallId={toolCallId} args={args} />
                )
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
        />
    );
};

export default BubbleMaps; 