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
      title: 'Discover & Compare Yields',
      description:
        'Find top Solana staking and lending opportunities with verified, real-time APY.',
      icon: Search,
    },
    {
      number: 2,
      title: 'Securely Connect Wallet',
      description:
        'Link your Solana wallet to instantly access and execute transactions on the best protocols.',
      icon: Wallet,
    },
    {
      number: 3,
      title: 'Start Earning Instantly',
      description:
        'Execute staking or lending actions directly from your wallet to maximize your rewards.',
      icon: TrendingUp,
    },
  ];

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
        className="max-w-5xl [&>button]:hidden bg-black border border-neutral-800 p-0"
        style={{ fontFamily: "var(--font-space-mono), 'Consolas', 'Monaco', monospace" }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-auto min-h-[280px]">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
            <DialogHeader className="mb-0">
              <DialogTitle className="text-xl font-bold text-white mb-1">
                Welcome to <span className="text-[#FFD700]">The Hive</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-400">
                Step {currentStep} of 3
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Horizontal Steps Layout */}
          <div className="flex-1 px-6 py-6">
            <div className="flex items-start gap-6">
              {steps.map((step, index) => {
                const isCompleted = step.number < currentStep;
                const isCurrent = step.number === currentStep;
                const isUpcoming = step.number > currentStep;
                const Icon = step.icon;

                return (
                  <React.Fragment key={step.number}>
                    <div
                      className={cn(
                        'flex-1 flex flex-col items-start transition-all duration-300',
                        isCurrent ? 'opacity-100' : isUpcoming ? 'opacity-40' : 'opacity-60',
                      )}
                    >
                      {/* Step Icon & Progress Indicator */}
                      <div className="flex items-center gap-3 mb-4 w-full">
                        <div
                          className={cn(
                            'flex-shrink-0 w-10 h-10 rounded border-2 flex items-center justify-center transition-all duration-300',
                            isCompleted
                              ? 'bg-[#FFD700] border-[#FFD700] text-black'
                              : isCurrent
                                ? 'bg-transparent border-[#FFD700] text-[#FFD700]'
                                : 'bg-transparent border-neutral-700 text-neutral-500',
                          )}
                        >
                          {isCompleted ? (
                            <svg
                              className="w-5 h-5"
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
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        {/* Progress Line */}
                        {index < steps.length - 1 && (
                          <div
                            className={cn(
                              'flex-1 h-0.5 transition-all duration-300',
                              isCompleted ? 'bg-[#FFD700]' : 'bg-neutral-800',
                            )}
                          />
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="w-full">
                        <h3
                          className={cn(
                            'text-base font-bold mb-2 transition-colors duration-300',
                            isCurrent ? 'text-[#FFD700]' : isCompleted ? 'text-neutral-300' : 'text-neutral-500',
                          )}
                        >
                          {step.title}
                        </h3>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Special Agent Message */}
            <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded px-4 py-3 flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-[#FFD700] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-200 mb-1">
                  Need help along the way?
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ask our specialized Agents using the chat input. They can help you find the best
                  yields, connect your wallet, and guide you through every step.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t border-neutral-800">
            <Button
              onClick={handleNext}
              className="w-full h-10 text-sm font-semibold bg-[#FFD700] hover:bg-[#FFED4E] text-black transition-all duration-200"
              style={{ fontFamily: "var(--font-space-mono), 'Consolas', 'Monaco', monospace" }}
            >
              {currentStep === 3 ? (
                'Start Earning Now'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
