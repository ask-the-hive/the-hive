export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { tokenAnalysisAgent } from './_data';

const TokenAnalysisAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-token-analysis">
      <AgentPage agent={tokenAnalysisAgent} />
    </ErrorBoundary>
  );
};

export default TokenAnalysisAgentPage;
