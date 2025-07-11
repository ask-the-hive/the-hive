'use client'

import React from 'react'

import Link from 'next/link';

import { Logo as LogoBase, useSidebar } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

const Logo: React.FC = () => {

    const { open } = useSidebar();

    return (
        <Link href="/" onClick={() => {
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('fromAppBackArrow', 'true');
            }
        }}>
            <span className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-neutral-500 hover:text-brand-600 transition-colors" />
                <LogoBase
                    showText={open}
                    className="w-8 h-8"
                />
            </span>
        </Link>
    )
}

export default Logo;