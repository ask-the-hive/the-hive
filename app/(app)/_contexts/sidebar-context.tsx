'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isChatsOpen: boolean;
  setIsChatsOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isChatsOpen: false,
  setIsChatsOpen: () => {},
});

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatsOpen, setIsChatsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isChatsOpen, setIsChatsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => useContext(SidebarContext); 