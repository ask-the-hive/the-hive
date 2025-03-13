export const dynamic = 'force-dynamic';

import React from 'react'
import AgentPage from '../_components';
import { socialAgent } from './_data';

const SocialAgentPage: React.FC = () => {
    return (
        <AgentPage
            agent={socialAgent}
        />
    )
}

export default SocialAgentPage;