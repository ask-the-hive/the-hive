export const dynamic = 'force-dynamic';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';
import AgentPage from '../_components';
import { socialAgent } from './_data';

const SocialAgentPage: React.FC = () => {
  return (
    <ErrorBoundary pageKey="agent-social">
      <AgentPage agent={socialAgent} />
    </ErrorBoundary>
  );
};

export default SocialAgentPage;
