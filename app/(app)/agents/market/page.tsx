export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { marketAgent } from './_data';

const MarketAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-market">
      <AgentPage agent={marketAgent} />
    </ErrorBoundary>
  );
};

export default MarketAgentPage;
