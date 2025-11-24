'use client';

import React, { useState } from 'react';
import { useLoginWithOAuth } from '@privy-io/react-auth';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { FaGoogle, FaTwitter, FaDiscord, FaGithub } from 'react-icons/fa6';
import { useRouter } from 'next/navigation';

const socialOptions = [
  {
    name: 'Google',
    provider: 'google' as const,
    icon: FaGoogle,
    bgColor: 'bg-white hover:bg-neutral-100',
    textColor: 'text-neutral-900',
  },
  {
    name: 'Twitter',
    provider: 'twitter' as const,
    icon: FaTwitter,
    bgColor: 'bg-[#1DA1F2] hover:bg-[#1a8cd8]',
    textColor: 'text-white',
  },
  {
    name: 'Discord',
    provider: 'discord' as const,
    icon: FaDiscord,
    bgColor: 'bg-[#5865F2] hover:bg-[#4752c4]',
    textColor: 'text-white',
  },
  {
    name: 'GitHub',
    provider: 'github' as const,
    icon: FaGithub,
    bgColor: 'bg-[#24292e] hover:bg-[#1b1f23]',
    textColor: 'text-white',
  },
];

export function SocialLogin() {
  const [error, setError] = useState('');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const router = useRouter();

  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => {
      router.push('/chat');
    },
    onError: (error) => {
      setError(error || 'Authentication failed. Please try again.');
    },
  });

  const handleOAuthLogin = async (provider: 'google' | 'twitter' | 'discord' | 'github') => {
    try {
      setError('');
      setConnectingProvider(provider);
      initOAuth({ provider });
    } catch (err: any) {
      setError(err?.message || String(err) || 'Failed to initiate login.');
      setConnectingProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {socialOptions.map((social) => {
          const Icon = social.icon;
          return (
            <Button
              key={social.provider}
              onClick={() => handleOAuthLogin(social.provider)}
              disabled={connectingProvider !== null}
              variant="brandGhost"
              className={`w-full justify-start h-[56px] ${social.bgColor} ${social.textColor} border-0 ${social.provider === 'google' && 'hover:text-white'}`}
            >
              <div className="flex items-center gap-4 w-full">
                <Icon
                  className={`text-xl ${social.provider === 'google' ? 'text-brand-600' : social.textColor}`}
                />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Continue with {social.name}</div>
                </div>
                {connectingProvider === social.provider && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="text-xs text-neutral-500 text-center">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}
