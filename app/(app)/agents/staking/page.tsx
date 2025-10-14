export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { stakingAgent } from './_data';

const StakingAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-staking">
      <AgentPage agent={stakingAgent} />
    </ErrorBoundary>
  );
};

export default StakingAgentPage;
