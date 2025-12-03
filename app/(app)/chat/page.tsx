export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { generateId } from 'ai';

const ChatPage = async ({ searchParams }: { searchParams: Promise<{ message?: string }> }) => {
  // Await searchParams
  const params = await searchParams;

  // Generate a new chat ID and redirect to the specific chat route
  const newChatId = generateId();
  // Preserve message query param if present
  const messageParam = params.message ? `?message=${params.message}` : '';
  redirect(`/chat/${newChatId}${messageParam}`);
};

export default ChatPage;
