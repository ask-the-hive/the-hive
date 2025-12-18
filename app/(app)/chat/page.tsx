export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { generateId } from 'ai';

const ChatPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; source?: string }>;
}) => {
  // Await searchParams
  const params = await searchParams;

  // Generate a new chat ID and redirect to the specific chat route
  const newChatId = generateId();
  // Preserve relevant query params if present
  const queryParams = new URLSearchParams();
  if (params.message) queryParams.set('message', params.message);
  if (params.source) queryParams.set('source', params.source);

  const queryString = queryParams.toString();
  redirect(`/chat/${newChatId}${queryString ? `?${queryString}` : ''}`);
};

export default ChatPage;
