'use client'

import React from 'react'
import { useLogin, usePrivy } from '@privy-io/react-auth';
import { Button, Skeleton } from '@/components/ui';

const LoginButton: React.FC = () => {
    const { authenticated, ready } = usePrivy();
    const { login } = useLogin();

    if (!ready || authenticated) return (
        <Skeleton className="w-24 h-10" />
    );

    return (
        <Button
            variant={'brand'}
            onClick={() => login()}
            disabled={authenticated}
            className="w-24 h-10"
        >
            Login
        </Button>
    )
}

export default LoginButton;