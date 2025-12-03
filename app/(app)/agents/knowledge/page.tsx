export const dynamic = 'force-dynamic';

import React from 'react'
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { knowledgeAgent } from './_data';

const KnowledgeAgentPage: React.FC = () => {
    return (
        <ErrorBoundary pageKey="agent-knowledge">
            <AgentPage
                agent={knowledgeAgent}
            />
        </ErrorBoundary>
    )
}

export default KnowledgeAgentPage; 