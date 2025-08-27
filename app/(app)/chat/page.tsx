export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { generateId } from 'ai';

const ChatPage = () => {
    // Generate a new chat ID and redirect to the specific chat route
    const newChatId = generateId();
    redirect(`/chat/${newChatId}`);
}

export default ChatPage;
