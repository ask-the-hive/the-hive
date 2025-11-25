import { getAllTags } from '@/services/arkham';
import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(async () => {
  const tokenTopFlow = await getAllTags();

  return NextResponse.json(tokenTopFlow);
});
