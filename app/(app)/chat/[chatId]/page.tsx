export const dynamic = 'force-dynamic';

import Chat from "../_components/chat";
import { ChatProvider } from "../_contexts/chat";

const ChatPage = () => {
    return (
        <ChatProvider>
            <div className="flex-1 h-0 overflow-y-hidden w-full">
                <Chat />
            </div>
        </ChatProvider>
    );
}

export default ChatPage;
