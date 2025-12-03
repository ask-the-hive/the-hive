import { NextRequest, NextResponse } from 'next/server';

import { addChat, getChat, updateChatMessages, deleteChat } from '@/db/services';

import { privy } from '@/services/privy';
import { generateText } from 'ai';
import { Message } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) => {
    const { chatId } = await params;

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(null, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token with Privy
    const { userId } = await privy.verifyAuthToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(await getChat(chatId, userId));
  },
);

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) => {
    const { chatId } = await params;

    const { messages, chain } = await req.json();

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(false, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token with Privy
    const { userId } = await privy.verifyAuthToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const chat = await getChat(chatId, userId);

    if (!chat) {
      try {
        return NextResponse.json(
          await addChat({
            id: chatId,
            userId,
            messages,
            tagline: await generateTagline(messages),
            chain: (chain as ChainType) || 'solana',
          }),
        );
      } catch (error: any) {
        // If chat already exists (race condition), try to get it instead
        if (error.code === 409) {
          console.log('Chat already exists due to race condition, fetching existing chat');
          const existingChat = await getChat(chatId, userId);
          if (existingChat) {
            return NextResponse.json(existingChat);
          }
        }
        throw error;
      }
    } else {
      // Update messages and chain if provided
      return NextResponse.json(
        await updateChatMessages(chatId, userId, {
          messages,
          chain: chain as ChainType,
        }),
      );
    }
  },
);

export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) => {
    const { chatId } = await params;

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    const token = authHeader.split(' ')[1];
    const { userId } = await privy.verifyAuthToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const success = await deleteChat(chatId, userId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
  },
);

const generateTagline = async (messages: Omit<Message, 'id'>[]) => {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      messages[0],
      {
        role: 'user',
        content:
          'Generate a 3-5 word description of the chat. Do not include any quotation marks or other punctuation.',
      },
    ],
  });

  return text;
};
