'use client';

import React from 'react';
import Link from 'next/link';
import { FaDiscord, FaXTwitter } from 'react-icons/fa6';
import { MoreHorizontal, Home } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from '@/components/ui';

export function MoreMenu() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-50">
          <DropdownMenuItem asChild>
            <Link
              href="https://the-hive-docs.gitbook.io/the-hive-docs/"
              target="_blank"
              className="flex items-center gap-3 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>About The Hive</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="https://x.com/askthehive_ai"
              target="_blank"
              className="flex items-center gap-3 cursor-pointer"
            >
              <FaXTwitter className="w-4 h-4" />
              <span>Follow Twitter</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="https://discord.gg/8TVcFvySWG"
              target="_blank"
              className="flex items-center gap-3 cursor-pointer"
            >
              <FaDiscord className="w-4 h-4" />
              <span>Join Discord</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
