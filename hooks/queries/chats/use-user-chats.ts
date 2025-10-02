import useSWR from 'swr';
import { usePrivy } from '@privy-io/react-auth';

import type { Chat } from '@/db/types';

export const useUserChats = () => {
  const { getAccessToken } = usePrivy();

  const { data, isLoading, error, mutate } = useSWR<Chat[]>('/api/chats', async (route: string) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    return fetch(route, {
      cache: 'no-cache',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => res.json());
  });

  return {
    chats: data ?? [],
    isLoading,
    error,
    mutate,
  };
};
