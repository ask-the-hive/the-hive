export const dynamic = 'force-dynamic';

import React from 'react'

import AgentPage from '../_components';

import { knowledgeAgent } from './_data';

const KnowledgeAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={knowledgeAgent}
        />
    )
}

export default KnowledgeAgentPage; 