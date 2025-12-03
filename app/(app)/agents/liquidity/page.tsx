export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { liquidityAgent } from './_data';

const LiquidityAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-liquidity">
      <AgentPage agent={liquidityAgent} />
    </ErrorBoundary>
  );
};

export default LiquidityAgentPage;
