'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Search, Wallet, TrendingUp, MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const steps = [
    {
      number: 1,
      title: 'Find Your Yield',
      description: 'Discover the best staking and lending opportunities with real-time APY data',
      icon: Search,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500',
    },
    {
      number: 2,
      title: 'Connect Wallet',
      description: 'Securely connect your Solana wallet to start earning',
      icon: Wallet,
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500',
    },
    {
      number: 3,
      title: 'Earn Yield',
      description: 'Stake or lend your assets and watch your rewards grow',
      icon: TrendingUp,
      iconColor: 'text-green-500',
      borderColor: 'border-green-500',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-bold mb-2">
            Welcome to <span className="text-brand-600">The Hive</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Your journey to earning yield starts here
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Three-Step Guide */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-neutral-200 dark:bg-neutral-700 hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex items-start gap-4 relative">
                    {/* Step Number & Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border-2 relative z-10',
                        step.borderColor,
                      )}
                    >
                      <Icon className={cn('w-7 h-7', step.iconColor)} />
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                          STEP {step.number}
                        </span>
                        <ArrowRight className="w-4 h-4 text-neutral-400 hidden md:block" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-neutral-600 dark:text-neutral-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Agent Message */}
          <div className="bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4 flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-brand-900 dark:text-brand-100 mb-1">
                Need help along the way?
              </p>
              <p className="text-sm text-brand-700 dark:text-brand-300">
                Ask our specialized Agents using the chat input. They can help you find the best
                yields, connect your wallet, and guide you through every step.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClose}
            className="w-full h-12 text-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white"
            size="lg"
          >
            Start Earning Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

