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
import GraphComponent from './index';
import UserProfile from './user-profile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          {/* FAQ Items - abbreviated for brevity */}
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
          {/* Add remaining FAQ items here... */}
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
