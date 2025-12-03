export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { tradingAgent } from './_data';

const TradingAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-trading">
      <AgentPage agent={tradingAgent} />
    </ErrorBoundary>
  );
};

export default TradingAgentPage;
