import { NextRequest, NextResponse } from 'next/server';

import { firecrawl } from '@/services/firecrawl';

import { FirecrawlDocument } from '@mendable/firecrawl-js';
import { embed, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { addKnowledge } from '@/db/services/knowledge';
import { KnowledgeInput } from '@/db/types';
import { withErrorHandling } from '@/lib/api-error-handler';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { url, name, includePaths, excludePaths, authCode } = await req.json();

  if (authCode !== process.env.CRAWL_AUTH_CODE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const crawlResponse = await firecrawl.asyncCrawlUrl(url, {
    limit: 500,
    maxDepth: 10,
    includePaths,
    excludePaths,
  });

  if (!crawlResponse.success) {
    return NextResponse.json(
      { error: toUserFacingErrorTextWithContext('Failed to start crawl.', crawlResponse.error) },
      { status: 500 },
    );
  }

  let status = 'scraping';
  let docs: FirecrawlDocument<undefined>[] = [];
  do {
    const statusResponse = await firecrawl.checkCrawlStatus(crawlResponse.id);
    if (!statusResponse.success) {
      return NextResponse.json(
        {
          error: toUserFacingErrorTextWithContext(
            'Failed to check crawl status.',
            statusResponse.error,
          ),
        },
        { status: 500 },
      );
    }
    status = statusResponse.status;
    if (statusResponse.status === 'completed') {
      docs = statusResponse.data;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (status === 'scraping');

  if (docs.length === 0) {
    return NextResponse.json({ error: 'No documents found' }, { status: 404 });
  }

  const knowledge = await Promise.all(
    docs.map(async (doc) => {
      if (!doc.markdown) {
        return;
      }
      const { text: summary } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Summarize the following documentation page in 1 sentence: ${doc.markdown}. This will be used to search for relevant knowledge. Do not include any other information.`,
      });
      const { embedding: summaryEmbedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: summary,
      });
      const knowledgeInputs: KnowledgeInput[] = [
        {
          baseUrl: url,
          name,
          url: doc.metadata?.url,
          title: doc.metadata?.title,
          description: doc.metadata?.description,
          favicon: doc.metadata?.favicon,
          markdown: doc.markdown,
          summary,
          summaryEmbedding,
        },
      ];
      for await (const knowledgeInput of knowledgeInputs) {
        await addKnowledge(knowledgeInput);
      }
      return true;
    }),
  );

  return NextResponse.json(knowledge);
});
