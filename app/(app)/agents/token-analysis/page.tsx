export const dynamic = 'force-dynamic';

import React from 'react'

import AgentPage from '../_components';

import { tokenAnalysisAgent } from './_data';

const TokenAnalysisAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={tokenAnalysisAgent}
        />
    )
}

export default TokenAnalysisAgentPage; 