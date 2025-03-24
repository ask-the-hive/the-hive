import React, { useEffect, useState, useRef } from 'react'
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { Models } from '@/types/models';
import { Button, Skeleton, Icon } from '@/components/ui';
import { Message } from 'ai';

interface Suggestion {
    title: string;
    description: string;
    prompt: string;
    icon: "Plus";
}

const generateFollowUpSuggestions = async (messages: Message[], model: Models) => {
    try {
        const response = await fetch('/api/follow-up-suggestions', {
            method: 'POST',
            body: JSON.stringify({
                messages,
                modelName: model,
                timestamp: Date.now()
            }),
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
        });

        // Check if response is ok and has content
        if (!response.ok) {
            console.warn("Failed to fetch suggestions:", response.status, response.statusText);
            return [];
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
            console.warn("Empty response received from suggestions API");
            return [];
        }

        try {
            return JSON.parse(text) as Suggestion[];
        } catch (parseError) {
            console.error("Failed to parse suggestions response:", parseError);
            return [];
        }
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return [];
    }
}

const FollowUpSuggestions: React.FC = () => {
    const { model, sendMessage, isResponseLoading, messages, chatId, isLoading } = useChat();
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const generateSuggestions = async () => {
            if (isResponseLoading || isLoading || !messages.length) return;
            
            if (requestTimeoutRef.current) {
                clearTimeout(requestTimeoutRef.current);
            }

            setIsGenerating(true);
            try {
                const newSuggestions = await generateFollowUpSuggestions(messages, model);
                if (newSuggestions?.length > 0) {
                    setSuggestions(newSuggestions);
                }
            } catch (error) {
                console.error('Error generating suggestions:', error);
            } finally {
                setIsGenerating(false);
            }
        };

        generateSuggestions();

        return () => {
            if (requestTimeoutRef.current) {
                clearTimeout(requestTimeoutRef.current);
            }
        };
    }, [messages, chatId, model, isResponseLoading, isLoading]);

    if (isLoading) return null;

    return (
        <div className="grid grid-cols-3 gap-2 mt-4">
            {
                isGenerating ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="w-full h-[22px]"
                        />
                    ))
                ) : (
                    suggestions.map((suggestion) => (
                        <Button
                            key={`${chatId}-${suggestion.title}`}
                            variant="outline"
                            className="w-full text-xs h-fit py-0.5"
                            onClick={() => {
                                sendMessage(suggestion.prompt);
                                setSuggestions([]);
                            }}
                        >
                            <Icon name="Plus" className="w-3 h-3" />
                            {suggestion.title}
                        </Button>
                    ))
                )
            }
        </div>
    );
};

export default FollowUpSuggestions;