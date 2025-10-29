export const dynamic = 'force-dynamic';

import Chat from '../_components/chat';
import { ChatProvider } from '../_contexts/chat';
import { SwapModalProvider } from '../../portfolio/[address]/_contexts/use-swap-modal';

const ChatPage = () => {
  return (
    <SwapModalProvider>
      <ChatProvider>
        <div className="flex-1 h-0 overflow-y-hidden w-full">
          <Chat />
        </div>
      </ChatProvider>
    </SwapModalProvider>
  );
};

export default ChatPage;
