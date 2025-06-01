import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftRight, ChartCandlestick, ContactRound, Brain, Beef, Wallet, Coins, Droplet, ChevronDown, Sun, Moon } from 'lucide-react'
import { useColorMode, ColorMode } from '@/app/_contexts'

function ColorModeToggle() {
    const { mode, setMode } = useColorMode();
    return (
        <button
            onClick={() => setMode(mode === ColorMode.DARK ? ColorMode.LIGHT : ColorMode.DARK)}
            className="ml-4 p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="Toggle color mode"
        >
            {mode === ColorMode.DARK ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
    );
}

export default function TopBar() {
    return (
        <div className="fixed top-4 left-64 right-64 z-50">
            <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="mx-auto px-2">
                    <div className="flex items-center h-14">
                        <div className="flex items-center">
                            <div className="relative w-6 h-6 mr-2">
                                <Image
                                    src="/logo.png"
                                    alt="The Hive Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-lg font-bold text-brand-600 font-sans">
                                The Hive
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-2">
                            <a 
                                href="https://docs.askthehive.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                            >
                                Documentation
                            </a>
                            <div className="relative group">
                                <button 
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    Agents
                                    <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:rotate-180 text-neutral-400" />
                                </button>
                                <div className="absolute right-0 mt-2 w-fit min-w-[120px] py-2 bg-white dark:bg-neutral-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-neutral-200 dark:border-neutral-700">
                                    <Link 
                                        href="/agents/trading"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                                            Trading
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/market"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <ChartCandlestick className="w-4 h-4 mr-2" />
                                            Market
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/social"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <ContactRound className="w-4 h-4 mr-2" />
                                            Social
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/liquidity"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <Droplet className="w-4 h-4 mr-2" />
                                            Liquidity
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/staking"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <Beef className="w-4 h-4 mr-2" />
                                            Staking
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/knowledge"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <Brain className="w-4 h-4 mr-2" />
                                            Knowledge
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/token-analysis"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <Coins className="w-4 h-4 mr-2" />
                                            Token
                                        </div>
                                    </Link>
                                    <Link 
                                        href="/agents/wallet"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Wallet
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            <div className="relative group">
                                <button 
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    Developers
                                    <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:rotate-180 text-neutral-400" />
                                </button>
                                <div className="absolute right-0 mt-2 w-fit min-w-[120px] py-2 bg-white dark:bg-neutral-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-neutral-200 dark:border-neutral-700">
                                    <a 
                                        href="https://github.com/ask-the-hive/the-hive" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            Upstream
                                        </div>
                                    </a>
                                    <a 
                                        href="https://github.com/1leozhao/the-hive" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            Fork
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <div className="relative group">
                                <button 
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    Socials
                                    <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:rotate-180 text-neutral-400" />
                                </button>
                                <div className="absolute right-0 mt-2 w-fit min-w-[120px] py-2 bg-white dark:bg-neutral-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-neutral-200 dark:border-neutral-700">
                                    <a 
                                        href="https://twitter.com/askthehive_ai" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                            Twitter
                                        </div>
                                    </a>
                                    <a 
                                        href="https://discord.gg/8TVcFvySWG" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                            </svg>
                                            Discord
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <Link 
                            href="/app" 
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                        >
                            Go to App
                        </Link>
                        <ColorModeToggle />
                    </div>
                </div>
            </div>
        </div>
    )
} 