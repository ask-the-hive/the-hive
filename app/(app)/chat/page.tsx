export const dynamic = 'force-dynamic';

import Chat from "./_components/chat";

import NotLoggedInAlert from "./_components/not-logged-in-alert";

const ChatPage = () => {
  return (
    <div className="flex-1 h-0 overflow-y-hidden w-full">
      <Chat />
      <NotLoggedInAlert />
    </div>
  );
}

export default ChatPage;
