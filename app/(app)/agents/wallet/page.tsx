export const dynamic = 'force-dynamic';

import React from 'react'

import AgentPage from '../_components';

import { walletAgent } from './_data';

const WalletAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={walletAgent}
        />
    )
}

export default WalletAgentPage; 