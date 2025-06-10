export const dynamic = 'force-dynamic';

import Chat from "./_components/chat";

const ChatPage = () => {
  return (
    <div className="flex-1 h-0 overflow-y-hidden w-full">
      <Chat />
    </div>
  );
}

export default ChatPage;
