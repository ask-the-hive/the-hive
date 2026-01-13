'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HoneycombBackground } from '@/components/ui/honeycomb-background';

export default function HomePage() {
  const router = useRouter();
  const [isDissolving, setIsDissolving] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsDissolving(true);
    // Wait for wave animation to complete (1.2s wave + 0.3s fade), then navigate
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        router.push('/chat');
      }, 300);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 dark:bg-neutral-900 overflow-hidden">
        {/* Honeycomb Background */}
        <div className="absolute inset-0">
          <HoneycombBackground 
            rows={20} 
            cols={30} 
            cellSize={400}
            isDissolving={isDissolving}
          />
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isExiting && (
            <motion.div
              className="relative z-10 flex flex-col items-center justify-center h-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hive Labs Branding */}
              <motion.h1
                className="text-4xl md:text-5xl font-bold mb-12 tracking-tight pointer-events-none relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  background: 'linear-gradient(90deg, #ffffff 0%, #ffd700 20%, #ffffff 40%, #ffd700 60%, #ffffff 80%, #ffd700 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shiny-text-home 3s ease-in-out infinite',
                }}
              >
                Hive Labs
              </motion.h1>

              {/* Enter Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="pointer-events-auto"
              >
                <button
                  onClick={handleEnter}
                  disabled={isDissolving}
                  className="relative px-8 py-3 text-base font-medium text-white border border-white/30 rounded-full 
                             bg-transparent backdrop-blur-sm
                             hover:border-white/60 hover:bg-white/5 
                             transition-all duration-300 ease-out
                             disabled:opacity-50 disabled:cursor-not-allowed
                             group overflow-hidden"
                >
                  <span className="relative z-10">Enter</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                   translate-x-[-100%] group-hover:translate-x-[100%] 
                                   transition-transform duration-700 ease-in-out" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
