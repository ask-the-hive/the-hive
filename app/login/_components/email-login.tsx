'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Loader2, Mail, KeyRound } from 'lucide-react';

export function EmailLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus email input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: () => {
      router.push('/chat');
    },
    onError: (error) => {
      setError(error || 'Authentication failed. Please try again.');
    },
  });

  const handleSendCode = async () => {
    try {
      setError('');
      await sendCode({ email });
      setIsCodeSent(true);
    } catch (err: any) {
      setError(err?.message || String(err) || 'Failed to send code. Please try again.');
    }
  };

  const handleLogin = async () => {
    try {
      setError('');
      await loginWithCode({ code });
    } catch (err: any) {
      setError(err?.message || String(err) || 'Invalid code. Please try again.');
    }
  };

  const isLoading = state.status === 'sending-code' || state.status === 'submitting-code';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="email" className="block text-sm font-medium text-sidebar-foreground">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-600" />
          <Input
            ref={emailInputRef}
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isCodeSent || isLoading}
            className="pl-10 h-[56px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isCodeSent && email) {
                handleSendCode();
              }
            }}
          />
        </div>
      </div>

      {isCodeSent && (
        <div className="space-y-3">
          <label htmlFor="code" className="block text-sm font-medium text-sidebar-foreground">
            Verification Code
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-[52px]"
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code) {
                  handleLogin();
                }
              }}
            />
          </div>
          <p className="text-xs text-neutral-500">Check your email for the verification code</p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {!isCodeSent ? (
        <Button
          onClick={handleSendCode}
          disabled={!email || isLoading}
          className="w-full h-[52px]"
          variant="brand"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending Code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={handleLogin}
            disabled={!code || code.length !== 6 || isLoading}
            className="w-full h-[52px]"
            variant="brand"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Verify & Login'
            )}
          </Button>
          <Button
            onClick={() => {
              setIsCodeSent(false);
              setCode('');
              setError('');
            }}
            variant="ghost"
            className="w-full h-[52px]"
            disabled={isLoading}
          >
            Use Different Email
          </Button>
        </div>
      )}

      <div className="text-xs text-neutral-500 text-center">
        By logging in with email, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}
