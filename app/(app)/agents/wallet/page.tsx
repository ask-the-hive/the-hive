export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';

import AgentPage from '../_components';

import { walletAgent } from './_data';

const WalletAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-wallet">
      <AgentPage agent={walletAgent} />
    </ErrorBoundary>
  );
};

export default WalletAgentPage;
