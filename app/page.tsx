'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BorderBeam } from '@/components/ui';
import LlmCarousel from '@/components/ui/llm-carousel';
import ApiCarousel from '@/components/ui/api-carousel';
import TopBar from '@/components/ui/top-bar';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import GraphComponent from './_components';
import UserProfile from './_components/user-profile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useColorMode } from './_contexts';
import ErrorBoundary from '@/components/error-boundary';

function FeatureCard({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.6,
        delay: index * 0.3,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
      className="relative text-center group hover:scale-105 transition-transform duration-300 p-6 rounded-xl"
    >
      <BorderBeam size={100} duration={10} colorFrom="#ffe00d" colorTo="#d19900" />
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-brand-600 mb-4">{title}</h3>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
    </motion.div>
  );
}

function TermsOfServiceDialog() {
  return (
    <Dialog>
      <DialogTrigger className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
        Terms of Service
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
          <p>By using The Hive, you agree to these terms:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You are responsible for your own actions and transactions</li>
            <li>We do not guarantee any investment returns</li>
            <li>You must comply with all applicable laws and regulations</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrivacyPolicyDialog() {
  return (
    <Dialog>
      <DialogTrigger className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
        Privacy Policy
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
          <p>Your privacy is important to us:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We do not store your private keys or sensitive data</li>
            <li>We do not collect any personal information</li>
            <li>We use industry-standard security measures</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LandingPageContent() {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const [checkedBackArrow, setCheckedBackArrow] = React.useState(false);
  const [showRedirecting, setShowRedirecting] = React.useState(false);
  const { mode } = useColorMode();

  // First effect: set checkedBackArrow true after mount
  React.useEffect(() => {
    setCheckedBackArrow(true);
  }, []);

  // Helper to detect browser back/forward navigation
  function isBackOrForwardNavigation() {
    if (typeof window !== 'undefined' && 'navigation' in window.performance) {
      // @ts-expect-error: getEntriesByType navigation is not typed in all browsers
      const navType = window.performance.getEntriesByType('navigation')[0]?.type;
      return navType === 'back_forward';
    } else if (
      typeof window !== 'undefined' &&
      window.performance &&
      window.performance.navigation
    ) {
      // Deprecated API, fallback
      return window.performance.navigation.type === 2;
    }
    return false;
  }

  // Second effect: only run redirect logic after checkedBackArrow is true
  React.useEffect(() => {
    if (!checkedBackArrow) return;
    if (ready && authenticated) {
      if (typeof window !== 'undefined') {
        const fromBackArrow = sessionStorage.getItem('fromAppBackArrow');
        if (fromBackArrow) {
          sessionStorage.removeItem('fromAppBackArrow');
          return; // Skip redirect
        }
        if (isBackOrForwardNavigation()) {
          return; // Skip redirect for browser back/forward
        }
      }
      // Wait 1s, then show message, then after another 1s, redirect
      const showMsgTimeout = setTimeout(() => {
        setShowRedirecting(true);
        const redirectTimeout = setTimeout(() => {
          router.replace('/chat');
        }, 1000);
        return () => clearTimeout(redirectTimeout);
      }, 1000);
      return () => clearTimeout(showMsgTimeout);
    }
  }, [ready, authenticated, router, checkedBackArrow]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <TopBar />
      <UserProfile />
      {/* Hero Section */}
      <div className="px-4 md:px-12">
        <div className="relative overflow-hidden pb-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 mt-8 min-h-[800px]">
          {/* Graph Component as Background */}
          <div className="absolute inset-0 w-full h-full">
            <GraphComponent />
          </div>
          <BorderBeam size={100} duration={10} colorFrom="#ffe00d" colorTo="#d19900" />
          <div className="relative z-10 pt-10 px-4" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-16 mb-16">
        <div className="relative p-6 rounded-xl group hover:scale-105 transition-transform duration-300">
          <BorderBeam size={100} duration={10} colorFrom="#ffe00d" colorTo="#d19900" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-brand-600">Multiple Agents.</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-brand-600">
                Interoperable Protocols.
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-brand-600">Zero Friction.</h2>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="relative z-10 text-center mt-8"
          >
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              We are building the intelligence layer for crypto.
            </p>
          </motion.div>
        </div>
      </div>
      <hr className="w-full max-w-4xl mx-auto my-12 border-t border-neutral-200 dark:border-neutral-700 mb-8" />
      <LlmCarousel />
      <hr className="w-full max-w-4xl mx-auto my-12 border-t border-neutral-200 dark:border-neutral-700 mb-8" />

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard
              index={0}
              title="Modular"
              description="Build and customize your DeFi experience using various AI agents"
            />
            <FeatureCard
              index={1}
              title="Interoperable"
              description="Seamlessly connect and interact with various DeFi protocols and services"
            />
            <FeatureCard
              index={2}
              title="Intuitive"
              description="Direct on-chain transactions and interactions using natural language"
            />
          </div>
        </div>
      </div>
      <hr className="w-full max-w-4xl mx-auto my-12 border-t border-neutral-200 dark:border-neutral-700 mb-8" />
      <ApiCarousel />
      <hr className="w-full max-w-4xl mx-auto my-12 border-t border-neutral-200 dark:border-neutral-700 mb-8" />
      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-16 mb-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center">
          Frequently Asked Questions
        </h2>
        <div className="mb-4" />
        <div className="flex flex-col gap-4">
          {/* FAQ Item 1 */}
          <Collapsible open={openFaq === 0} onOpenChange={(v) => setOpenFaq(v ? 0 : null)}>
            <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
              <span>What is The Hive?</span>
              <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
            </CollapsibleTrigger>
            <AnimatePresence>
              {openFaq === 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base">
                    The Hive is a modular network of interoperable DeFi agents, enabling on-chain
                    transactions and interactions using natural language.
                  </CollapsibleContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
          {/* FAQ Item 2 */}
          <Collapsible open={openFaq === 1} onOpenChange={(v) => setOpenFaq(v ? 1 : null)}>
            <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
              <span>Which blockchains are supported?</span>
              <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
            </CollapsibleTrigger>
            <AnimatePresence>
              {openFaq === 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base">
                    Originally built on Solana, The Hive now supports various EVM chains such as BSC
                    and Base, with future plans to expand to even more chains.
                  </CollapsibleContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
          {/* FAQ Item 3 */}
          <Collapsible open={openFaq === 2} onOpenChange={(v) => setOpenFaq(v ? 2 : null)}>
            <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
              <span>What else can The Hive do?</span>
              <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
            </CollapsibleTrigger>
            <AnimatePresence>
              {openFaq === 2 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base">
                    The Hive also offers an AI-powered token dashboard, a portfolio tracker for
                    connected wallets, and natural language execution for supported protocols.
                  </CollapsibleContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
          {/* FAQ Item 4 */}
          <Collapsible open={openFaq === 3} onOpenChange={(v) => setOpenFaq(v ? 3 : null)}>
            <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
              <span>Is the project open source?</span>
              <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
            </CollapsibleTrigger>
            <AnimatePresence>
              {openFaq === 3 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base">
                    Yes! The Hive is open source and welcomes community contributions. Make a pull
                    request to the official{' '}
                    <a
                      href="https://github.com/1leozhao/the-hive"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      fork repository
                    </a>
                    .
                  </CollapsibleContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
          {/* FAQ Item 5 */}
          <Collapsible open={openFaq === 4} onOpenChange={(v) => setOpenFaq(v ? 4 : null)}>
            <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
              <span>Does The Hive have a token?</span>
              <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
            </CollapsibleTrigger>
            <AnimatePresence>
              {openFaq === 4 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base">
                    Yes, $BUZZ is the native token of The Hive. Its contract address is{' '}
                    <span className="relative inline-block align-middle">
                      <span
                        className="font-mono break-all text-brand-600 underline hover:text-brand-700 cursor-pointer"
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            '9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump',
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1200);
                        }}
                      >
                        9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump
                      </span>
                      {copied && (
                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs rounded bg-neutral-800 text-white shadow z-10 whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </span>
                    {'. '}$BUZZ is strictly a meme coin.
                  </CollapsibleContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
          {/* FAQ Item 6 */}
          <Collapsible open={openFaq === 5} onOpenChange={(v) => setOpenFaq(v ? 5 : null)}>
            <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
              <span>Is there a community channel?</span>
              <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
            </CollapsibleTrigger>
            <AnimatePresence>
              {openFaq === 5 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base">
                    The Hive community lives on{' '}
                    <a
                      href="https://x.com/askthehive_ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      Twitter
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://discord.gg/8TVcFvySWG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      Discord
                    </a>
                    . Any telegram channel claiming to represent The Hive is fake.
                  </CollapsibleContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
        </div>
        <div className="text-center mt-8 text-base text-neutral-600 dark:text-neutral-300">
          Any more questions? Join the{' '}
          <a
            href="https://discord.gg/8TVcFvySWG"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline hover:text-brand-700"
          >
            Discord server
          </a>
          !
        </div>
      </div>

      {/* Footer Divider and Branding */}
      <div className="w-full flex flex-col items-center mt-16 mb-8">
        <hr className="w-full max-w-4xl border-t border-neutral-200 dark:border-neutral-700 mb-8" />
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-row items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="The Hive Logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold text-brand-600 font-sans">The Hive</span>
          </div>
          <div className="flex gap-4">
            <TermsOfServiceDialog />
            <PrivacyPolicyDialog />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRedirecting && (
          <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg pointer-events-auto
                                ${mode === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900 border border-neutral-200'}`}
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Welcome back! Redirecting...</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        :root {
          --gradient-start: #ffffff;
          --gradient-end: #fff7b2;
        }
        .dark {
          --gradient-start: #171717;
          --gradient-end: #262626;
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ErrorBoundary pageKey="landing">
      <LandingPageContent />
    </ErrorBoundary>
  );
}
