import { NextResponse } from 'next/server';

import { findKnowledgeByUrl } from '@/db/services';
import { withErrorHandling } from '@/lib/api-error-handler';

export const POST = withErrorHandling(async (req: Request) => {
  const { url } = await req.json();
  const knowledge = await findKnowledgeByUrl(url);
  return NextResponse.json(knowledge.length > 0 ? knowledge[0] : null);
});
