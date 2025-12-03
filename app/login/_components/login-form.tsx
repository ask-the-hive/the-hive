'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { EmailLogin } from './email-login';
import { WalletLogin } from './wallet-login';
import { SocialLogin } from './social-login';
import Image from 'next/image';
import { Wallet, MessageSquare, Mail } from 'lucide-react';

export function LoginForm() {
  const [activeTab, setActiveTab] = useState('wallet');

  return (
    <div className="w-full max-w-md mx-auto md:px-8 py-8">
      {/* Logo and Header */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="The Hive" width={64} height={64} className="rounded-lg" />
        </div>
        <h1 className="text-3xl font-bold text-sidebar-foreground mb-2">
          Welcome to <span className="text-brand-600">The Hive</span>
        </h1>
        <p className="text-neutral-400">Sign in to access DeFi with your wallet</p>
      </div>

      {/* Tabs for different login methods */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet">
            <Wallet className="w-4 h-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="social">
            <MessageSquare className="w-4 h-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Fixed height container to prevent jumping */}
        <div className="mt-6 min-h-[400px]">
          <TabsContent value="wallet" className="m-0">
            <WalletLogin />
          </TabsContent>

          <TabsContent value="social" className="m-0">
            <SocialLogin />
          </TabsContent>

          <TabsContent value="email" className="m-0">
            <EmailLogin />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-neutral-600">
        <p>© 2025 The Hive. All rights reserved.</p>
      </div>
    </div>
  );
}
