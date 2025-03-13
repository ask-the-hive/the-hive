export const dynamic = 'force-dynamic';

import React from 'react'

import AgentPage from '../_components';

import { marketAgent } from './_data';

const MarketAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={marketAgent}
        />
    )
}

export default MarketAgentPage;