export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { generateId } from 'ai';

const ChatPage = ({ searchParams }: { searchParams: { message?: string } }) => {
  // Generate a new chat ID and redirect to the specific chat route
  const newChatId = generateId();
  // Preserve message query param if present
  const messageParam = searchParams.message ? `?message=${searchParams.message}` : '';
  redirect(`/chat/${newChatId}${messageParam}`);
};

export default ChatPage;
