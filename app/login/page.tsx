'use client';

import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from './_components/login-form';
import { BrandingSection } from './_components/branding-section';
import { Skeleton, Button } from '@/components/ui';

export default function LoginPage() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  const handleBackClick = () => {
    router.push('/chat');
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (ready && authenticated) {
      router.push('/chat');
    }
  }, [ready, authenticated, router]);

  // Show loading state while checking auth
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <Skeleton className="w-96 h-96 rounded-lg" />
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Back Button */}
      <Button
        variant="brandGhost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-14 w-14 rounded-full bg-neutral-100 backdrop-blur-sm hover:bg-neutral-200 dark:bg-neutral-600 dark:hover:bg-neutral-600"
        onClick={handleBackClick}
      >
        <ArrowLeft className="h-20 w-20 text-brand-600" />
      </Button>

      {/* Left side - Login Form (40%) */}
      <div className="w-full md:w-[40%] bg-sidebar flex items-center justify-center min-h-screen p-6">
        <LoginForm />
      </div>

      {/* Right side - Branding (60%) */}
      <div className="hidden md:flex md:w-[60%]">
        <BrandingSection />
      </div>
    </div>
  );
}
