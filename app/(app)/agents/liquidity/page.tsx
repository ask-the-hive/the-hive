export const dynamic = 'force-dynamic';

import React from 'react'

import AgentPage from '../_components';

import { liquidityAgent } from './_data';

const LiquidityAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={liquidityAgent}
        />
    )
}

export default LiquidityAgentPage; 