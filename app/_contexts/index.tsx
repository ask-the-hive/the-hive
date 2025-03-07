"use client";

import { Analytics } from "@vercel/analytics/react"

import { PrivyProvider } from "./privy";
import { ColorModeProvider } from "./color-mode";
import { PostHogProvider } from "./posthog";
import { ChainProvider } from "./chain-context";

interface Props {
    children: React.ReactNode;
}

const Providers: React.FC<Props> = ({ children }) => {
    return (
        <PostHogProvider>
            <PrivyProvider>
                <ColorModeProvider>
                    <ChainProvider>
                        <Analytics />
                        {children}
                    </ChainProvider>
                </ColorModeProvider>
            </PrivyProvider>
        </PostHogProvider>
    )
}

export default Providers;

export * from "./color-mode"
export * from "./chain-context"