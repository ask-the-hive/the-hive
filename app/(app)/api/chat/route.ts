import { NextRequest } from 'next/server';

import { streamText } from 'ai';

import { Coinbase } from '@coinbase/coinbase-sdk';

import { openai } from '@ai-sdk/openai';

import { CdpAgentkit, cdpTools } from '@/ai';
import { withErrorHandling } from '@/lib/api-error-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { messages } = await req.json();

  const agentkit = await CdpAgentkit.configureWithWallet({
    networkId: Coinbase.networks.BaseSepolia,
    cdpWalletData: process.env.WALLET_DETAILS,
  });

  const result = streamText({
    model: openai('gpt-4o-mini'),
    tools: cdpTools(agentkit),
    messages,
  });

  result.toDataStream();

  return result.toDataStreamResponse();
});
