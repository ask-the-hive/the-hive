import { Message } from "ai"
import { ChainType } from "@/app/_contexts/chain-context"

export type Chat = {
    id: string;
    messages: Message[];
    tagline: string;
    userId: string;
    chain?: ChainType;
}