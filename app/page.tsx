'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { BorderBeam } from '@/components/ui'
import LlmCarousel from '@/components/ui/llm-carousel'
import ApiCarousel from '@/components/ui/api-carousel'
import TopBar from '@/components/ui/top-bar'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

function FeatureCard({ title, description, index }: { title: string; description: string; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ 
                duration: 1.2,
                delay: index * 0.7,
                ease: [0.21, 1.11, 0.81, 0.99]
            }}
            className="relative text-center group hover:scale-105 transition-transform duration-300 p-6 rounded-xl"
        >
            <BorderBeam size={100} duration={10} colorFrom="#ffe00d" colorTo="#d19900" />
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-brand-600 mb-4">{title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}

function LandingPageContent() {
    const [copied, setCopied] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    return (
        <div className="min-h-screen bg-white dark:bg-neutral-900">
            <TopBar />
            {/* Hero Section with Gradient */}
            <div className="px-4 md:px-12">
                <div className="relative overflow-hidden pb-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 mt-8">
                    {/* Modern Gradient Overlay */}
                    <div className="absolute inset-0 z-0 pointer-events-none hero-gradient" style={{
                        background: 'linear-gradient(120deg, rgba(186, 230, 253, 0.35) 0%, rgba(253, 224, 71, 0.25) 50%, rgba(192, 132, 252, 0.35) 160%)'
                    }} />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
                        <div className="text-center">
                            <motion.h1
                                className="text-5xl md:text-6xl font-bold text-brand-600 mb-6"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
                            >
                                The Hive
                            </motion.h1>
                            <motion.p
                                className="text-xl md:text-2xl text-neutral-600 dark:text-white mb-8 max-w-3xl mx-auto"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 1.11, 0.81, 0.99] }}
                            >
                                A modular network of interoperable DeFi agents
                            </motion.p>
                            <motion.div
                                className="relative w-72 h-72 mx-auto mb-8"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 1.11, 0.81, 0.99] }}
                            >
                                <Image
                                    src="/logo.png"
                                    alt="The Hive Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
            <LlmCarousel />
            <hr className="w-full max-w-4xl mx-auto my-20 border-t border-neutral-200 dark:border-neutral-700 mb-8" />

            {/* Features Section */}
            <div className="py-24">
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
            <hr className="w-full max-w-4xl mx-auto my-20 border-t border-neutral-200 dark:border-neutral-700 mb-8" />
            <ApiCarousel />
            <hr className="w-full max-w-4xl mx-auto my-20 border-t border-neutral-200 dark:border-neutral-700 mb-8" />
            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mt-24 mb-16 px-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center">
                    Frequently Asked Questions
                </h2>
                <div className="mb-4" />
                <div className="flex flex-col gap-4">
                    {/* FAQ Item 1 */}
                    <Collapsible open={openFaq === 0} onOpenChange={v => setOpenFaq(v ? 0 : null)}>
                        <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
                            <span>What is The Hive?</span>
                            <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base transition-all duration-300">
                            The Hive is a modular network of interoperable DeFi agents, enabling on-chain transactions and interactions using natural language.
                        </CollapsibleContent>
                    </Collapsible>
                    {/* FAQ Item 2 */}
                    <Collapsible open={openFaq === 1} onOpenChange={v => setOpenFaq(v ? 1 : null)}>
                        <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
                            <span>Which blockchains are supported?</span>
                            <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base transition-all duration-300">
                            Originally built on Solana, The Hive now supports various EVM chains such as BSC and Base, with plans to expand further.
                        </CollapsibleContent>
                    </Collapsible>
                    {/* FAQ Item 3 */}
                    <Collapsible open={openFaq === 2} onOpenChange={v => setOpenFaq(v ? 2 : null)}>
                        <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
                            <span>What else can The Hive do?</span>
                            <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base transition-all duration-300">
                            The Hive also features an AI-powered token dashboard for detailed analytics, as well as a personal portfolio for connected wallets.
                        </CollapsibleContent>
                    </Collapsible>
                    {/* FAQ Item 4 */}
                    <Collapsible open={openFaq === 3} onOpenChange={v => setOpenFaq(v ? 3 : null)}>
                        <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
                            <span>Is the project open source?</span>
                            <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base transition-all duration-300">
                            Yes! The Hive is open source and welcomes community contributions. Make a pull request to the official <a href="https://github.com/1leozhao/the-hive" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">fork repository</a>.
                        </CollapsibleContent>
                    </Collapsible>
                    {/* FAQ Item 5 */}
                    <Collapsible open={openFaq === 4} onOpenChange={v => setOpenFaq(v ? 4 : null)}>
                        <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
                            <span>Does The Hive have a token?</span>
                            <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base transition-all duration-300">
                            Yes, BUZZ is the native token of The Hive. Its contract address is{' '}
                            <span className="relative inline-block align-middle">
                                <span
                                    className="font-mono break-all text-brand-600 underline hover:text-brand-700 cursor-pointer"
                                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                                    onClick={() => {
                                        navigator.clipboard.writeText('9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump');
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
                            {' '}and it is strictly a memecoin.
                        </CollapsibleContent>
                    </Collapsible>
                    {/* FAQ Item 6 */}
                    <Collapsible open={openFaq === 5} onOpenChange={v => setOpenFaq(v ? 5 : null)}>
                        <CollapsibleTrigger className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg px-6 py-4 text-left text-lg font-medium flex justify-between items-center group">
                            <span>Is there a Telegram channel?</span>
                            <ChevronDown className="ml-2 w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-neutral-400" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="w-full bg-white dark:bg-neutral-900 rounded-b-lg px-6 py-4 text-base transition-all duration-300">
                            No, the only official links are the {' '}
                            <a href="https://x.com/askthehive_ai" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">Twitter</a>{' '}and{' '}<a href="https://discord.gg/8TVcFvySWG" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">Discord</a>. Any telegram channel is a scam.
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <div className="text-center mt-8 text-base text-neutral-600 dark:text-neutral-300">
                    Any more questions? Join the{' '}
                    <a href="https://discord.gg/8TVcFvySWG" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">Discord server</a>!
                </div>
            </div>

            {/* Footer Divider and Branding */}
            <div className="w-full flex flex-col items-center mt-24 mb-8">
                <hr className="w-full max-w-4xl border-t border-neutral-200 dark:border-neutral-700 mb-8" />
                <div className="flex flex-row items-center gap-3">
                    <div className="relative w-10 h-10">
                        <Image
                            src="/logo.png"
                            alt="The Hive Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-lg font-bold text-brand-600 font-sans">The Hive</span>
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
                    --hero-gradient: linear-gradient(120deg, 
                        rgba(96, 165, 250, 0.3) 0%, 
                        rgba(234, 179, 8, 0.25) 50%, 
                        rgba(168, 85, 247, 0.3) 160%
                    );
                }
                .dark .hero-gradient {
                    background: var(--hero-gradient);
                    filter: blur(8px);
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}

export default function LandingPage() {
    return <LandingPageContent />;
}