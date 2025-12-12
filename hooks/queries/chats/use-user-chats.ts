export const useUserChats = () => {
  return {
    chats: [],
    isLoading: false,
    error: null,
    mutate: () => Promise.resolve([]),
  };
};
