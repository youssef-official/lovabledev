'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Cpu, Globe } from 'lucide-react';

interface ModelSelectorProps {
    isOpen: boolean;
    onSelect: (model: 'minimax' | 'openrouter') => void;
}

export function ModelSelector({ isOpen, onSelect }: ModelSelectorProps) {
    const [selected, setSelected] = useState<'minimax' | 'openrouter' | null>(null);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                >
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Choose Your AI Model</h2>
                    <p className="text-white/60 text-center mb-8">
                        Select the default AI model for generating your projects. You can change this later.
                    </p>

                    <div className="space-y-4 mb-8">
                        <button
                            onClick={() => setSelected('minimax')}
                            className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${selected === 'minimax'
                                    ? 'bg-blue-600/20 border-blue-500'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className={`p-3 rounded-lg ${selected === 'minimax' ? 'bg-blue-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                                <Cpu className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-white font-semibold">MiniMax</h3>
                                <p className="text-white/50 text-sm">Fast & Efficient</p>
                            </div>
                            {selected === 'minimax' && <Check className="w-5 h-5 text-blue-400" />}
                        </button>

                        <button
                            onClick={() => setSelected('openrouter')}
                            className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${selected === 'openrouter'
                                    ? 'bg-purple-600/20 border-purple-500'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className={`p-3 rounded-lg ${selected === 'openrouter' ? 'bg-purple-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-white font-semibold">OpenRouter</h3>
                                <p className="text-white/50 text-sm">Access to GPT-4, Claude, etc.</p>
                            </div>
                            {selected === 'openrouter' && <Check className="w-5 h-5 text-purple-400" />}
                        </button>
                    </div>

                    <button
                        onClick={() => selected && onSelect(selected)}
                        disabled={!selected}
                        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${selected
                                ? 'bg-white text-black hover:bg-white/90'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        Continue
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
