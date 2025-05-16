export const dynamic = 'force-dynamic';

import React from 'react'

import AgentPage from '../_components';

import { stakingAgent } from './_data';

const StakingAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={stakingAgent}
        />
    )
}

export default StakingAgentPage; 