import { NextRequest } from 'next/server';

import { searchForTokens } from '@/services/search';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return Response.json([]);
  return Response.json(await searchForTokens(q));
});
