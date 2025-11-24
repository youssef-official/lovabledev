'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface ThinkingDisplayProps {
    isThinking: boolean;
    isGenerating: boolean;
    thinkingDuration?: number;
    message?: string;
}

export function ThinkingDisplay({
    isThinking,
    isGenerating,
    thinkingDuration,
    message
}: ThinkingDisplayProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!isThinking && !isGenerating) {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed(prev => prev + 100);
        }, 100);

        return () => clearInterval(interval);
    }, [isThinking, isGenerating]);

    if (!isThinking && !isGenerating) return null;

    const seconds = Math.floor(elapsed / 1000);

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            {isThinking ? (
                <>
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    <div className="flex-1">
                        <div className="text-white/90 text-sm font-medium">
                            {thinkingDuration
                                ? `Thought for ${Math.floor(thinkingDuration / 1000)}s`
                                : seconds > 3
                                    ? 'Thinking longer...'
                                    : 'Thinking...'}
                        </div>
                        {message && (
                            <div className="text-white/60 text-xs mt-0.5">{message}</div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                    <div className="flex-1">
                        <div className="text-white/90 text-sm font-medium">Generating code...</div>
                        {message && (
                            <div className="text-white/60 text-xs mt-0.5">{message}</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
