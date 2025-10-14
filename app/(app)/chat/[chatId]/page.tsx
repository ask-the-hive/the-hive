export const dynamic = 'force-dynamic';

import ErrorBoundary from '@/components/error-boundary';
import Chat from '../_components/chat';
import { ChatProvider } from '../_contexts/chat';

const ChatPage = () => {
  return (
    <ErrorBoundary pageKey="chat">
      <ChatProvider>
        <div className="flex-1 h-0 overflow-y-hidden w-full">
          <Chat />
        </div>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default ChatPage;
