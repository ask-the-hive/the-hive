'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Search, Wallet, TrendingUp, MessageCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

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

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl [&>button]:hidden bg-gradient-to-br from-white via-white to-neutral-50 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05),0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2),0_20px_60px_rgba(0,0,0,0.5)]"
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

        {/* Progress Indicator */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Step {currentStep} of 3
          </div>
          <div className="flex items-center gap-3">
            {steps.map((step, index) => {
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              return (
                <React.Fragment key={step.number}>
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                      isCompleted
                        ? 'bg-[#FFD700] border-[#FFD700] text-neutral-900 shadow-lg shadow-[#FFD700]/30'
                        : isCurrent
                          ? 'bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300'
                          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400',
                    )}
                    disabled={step.number > currentStep}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <step.icon className={cn('w-6 h-6', isCurrent && step.iconColor)} />
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-8 h-0.5 transition-all duration-300',
                        isCompleted
                          ? 'bg-[#FFD700]'
                          : 'bg-neutral-200 dark:bg-neutral-700',
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="space-y-8 py-6">
          {/* Current Step Content */}
          <div className="flex flex-col items-center text-center space-y-6 min-h-[300px] justify-center">
            <div
              className={cn(
                'w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border-4 transition-all duration-300',
                currentStepData.borderColor,
              )}
            >
              <Icon className={cn('w-12 h-12', currentStepData.iconColor)} />
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-bold">{currentStepData.title}</h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* Special Agent Message - Show on all steps */}
            <div className="bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4 flex items-start gap-3 max-w-md">
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
          </div>

          {/* Navigation Button */}
          <Button
            onClick={handleNext}
            className="w-full h-12 text-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200"
            size="lg"
          >
            {currentStep === 3 ? (
              'Start Earning Now'
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

