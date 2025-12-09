'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FiFile,
  FiChevronRight,
  FiChevronDown,
  FiGithub,
  BsFolderFill,
  BsFolder2Open,
  SiJavascript,
  SiReact,
  SiCss3,
  SiJson,
  FaSun,
  FaMoon
} from '@/lib/icons';
import { UserButton } from '@/components/UserButton';
import { useApiRequest } from '@/hooks/useApiRequest';
import { motion } from 'framer-motion';
import CodeApplicationProgress, { type CodeApplicationState } from '@/components/CodeApplicationProgress';

// ... (Interfaces remain the same as in the backup file) ...
interface SandboxData {
    sandboxId: string;
    url: string;
    [key: string]: any;
}

interface ChatMessage {
    content: string;
    type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
    timestamp: Date;
    metadata?: {
      websiteDescription?: string;
      generatedCode?: string;
      appliedFiles?: string[];
      commandType?: 'input' | 'output' | 'error' | 'success';
    };
}


function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;
    const router = useRouter();
    const searchParams = useSearchParams();

    // All the state from AISandboxPage is moved here, without the home screen logic
    const { makeRequest, makeRequestWithBody, hasRequiredKeys } = useApiRequest();
    const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ text: 'Not connected', active: false });
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [aiChatInput, setAiChatInput] = useState('');
    const [aiModel, setAiModel] = useState(() => {
        const modelParam = searchParams.get('model');
        return appConfig.ai.availableModels.includes(modelParam || '') ? modelParam! : appConfig.ai.defaultModel;
    });
    const [activeTab, setActiveTab] = useState<'generation' | 'preview'>('preview');
    const [generationProgress, setGenerationProgress] = useState<any>({
        isGenerating: false,
        files: [],
    });
    const [isDarkMode, setIsDarkMode] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const [conversationContext, setConversationContext] = useState<any>({
        appliedCode: [],
    });
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'src', 'src/components']));
    const [selectedFile, setSelectedFile] = useState<string | null>(null);


    // Simplified useEffect for project page
    useEffect(() => {
        // Fetch project-specific data here
        addChatMessage(`Welcome to Project ${projectId}! You can start chatting to build and modify your project.`, 'system');

        // You would typically fetch project details, including its sandbox, files, and chat history
        // For now, we'll just create a new sandbox for the project
        createSandbox();
    }, [projectId]);

    // Scroll chat to bottom on new messages
    useEffect(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // All the helper functions from AISandboxPage will be here
    // (addChatMessage, createSandbox, sendChatMessage, etc.)
    // For brevity, I will add placeholders and the main sendChatMessage logic

    const addChatMessage = (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => {
        setChatMessages(prev => [...prev, { content, type, timestamp: new Date(), metadata }]);
    };

    const createSandbox = async () => {
        setLoading(true);
        addChatMessage('Setting up your development sandbox...', 'system');
        try {
            // In a real app, you'd associate the sandbox with the project ID
            const response = await makeRequestWithBody('/api/create-ai-sandbox', {});
            const data = await response.json();
            if (data.success) {
                setSandboxData(data);
                addChatMessage(`Sandbox is ready! You can now ask me to make changes.`, 'system');
                if (iframeRef.current) {
                    iframeRef.current.src = data.url;
                }
            } else {
                throw new Error(data.error || 'Failed to create sandbox');
            }
        } catch (error: any) {
            addChatMessage(`Error creating sandbox: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const sendChatMessage = async () => {
        const message = aiChatInput.trim();
        if (!message) return;

        addChatMessage(message, 'user');
        setAiChatInput('');

        try {
            const response = await makeRequestWithBody('/api/generate-ai-code-stream', {
                prompt: message,
                model: aiModel,
                projectId: projectId,
                context: {
                    sandboxId: sandboxData?.sandboxId,
                    conversationContext: conversationContext
                },
                isEdit: conversationContext.appliedCode.length > 0
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                // Update state based on streaming data (e.g., generationProgress, chatMessages)
                                if (data.type === 'conversation') {
                                    addChatMessage(data.text, 'ai');
                                }
                            } catch (e) {
                                console.error('Failed to parse SSE data:', e);
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            addChatMessage(`Error: ${error.message}`, 'error');
        }
    };

    // Theme helper
    const theme = {
        bg_main: isDarkMode ? 'bg-gray-950' : 'bg-white',
        text_main: isDarkMode ? 'text-white' : 'text-gray-900',
        bg_card: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
        border_color: isDarkMode ? 'border-gray-800' : 'border-gray-200',
        chat_user_bg: isDarkMode ? 'bg-gray-700' : 'bg-gray-200',
        chat_ai_bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'jsx' || ext === 'js') {
            return <SiJavascript className="w-4 h-4 text-yellow-500" />;
        } else if (ext === 'tsx' || ext === 'ts') {
            return <SiReact className="w-4 h-4 text-blue-500" />;
        } else if (ext === 'css') {
            return <SiCss3 className="w-4 h-4 text-blue-500" />;
        } else if (ext === 'json') {
            return <SiJson className="w-4 h-4 text-gray-600" />;
        } else {
            return <FiFile className="w-4 h-4 text-gray-600" />;
        }
    };

    const toggleFolder = (folderPath: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderPath)) {
            newExpanded.delete(folderPath);
        } else {
            newExpanded.add(folderPath);
        }
        setExpandedFolders(newExpanded);
    };

    const handleFileClick = async (filePath: string) => {
        setSelectedFile(filePath);
    };

    const renderMainContent = () => {
        if (activeTab === 'generation') {
            return (
                <div className="flex-1 rounded-lg p-6 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                        {generationProgress.files.map((file: any, idx: number) => (
                            <div key={idx} className={`bg-gray-900 border ${theme.border_color} rounded-lg overflow-hidden mb-4`}>
                                <div className={`px-4 py-2 bg-gray-800 text-white flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        {getFileIcon(file.path)}
                                        <span className="font-mono text-sm">{file.path}</span>
                                    </div>
                                </div>
                                <div className={`bg-gray-950 border ${theme.border_color} rounded`}>
                                    <SyntaxHighlighter
                                        language={file.path.split('.').pop() === 'css' ? 'css' : 'jsx'}
                                        style={vscDarkPlus}
                                        customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', background: 'transparent' }}
                                        showLineNumbers={true}
                                    >
                                        {file.content}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === 'preview') {
            if (sandboxData?.url && !loading) {
                return (
                    <iframe
                        ref={iframeRef}
                        src={sandboxData.url}
                        className="w-full h-full border-none"
                        title="Project Sandbox Preview"
                    />
                );
            }
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    {loading ? 'Loading Sandbox...' : 'Sandbox not available.'}
                </div>
            );
        }

        return null;
    };

    // The full JSX from AISandboxPage, but without the home screen
    return (
        <div className={`font-sans ${theme.bg_main} ${theme.text_main} h-screen flex flex-col`}>
            {/* Main Header */}
            <div className={`px-4 py-4 border-b ${theme.border_color} flex items-center justify-between ${theme.bg_card}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg flex items-center justify-center border ${theme.border_color}`}>
                            <span className={`font-bold text-lg ${theme.text_main}`}>❤️</span>
                        </div>
                        <span className={`font-semibold text-lg ${theme.text_main}`}>Project: {projectId}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className={`px-3 py-1.5 text-sm ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} border rounded-[10px]`}
                    >
                         <option value="MiniMax M2">MiniMax M2</option>
                         <option value="Open Router">Open Router</option>
                    </select>
                    <UserButton />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Center Panel - AI Chat */}
                <div className={`flex-1 max-w-[400px] flex flex-col border-r ${theme.border_color} ${theme.bg_card}`}>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 scrollbar-hide" ref={chatMessagesRef}>
                        {chatMessages.map((msg, idx) => (
                             <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
                                <div className={`rounded-[10px] px-4 py-2 max-w-[80%] ${
                                    msg.type === 'user' ? `${theme.chat_user_bg} text-white` :
                                    msg.type === 'ai' ? `${theme.chat_ai_bg} ${theme.text_main}` :
                                    'bg-yellow-200 text-yellow-900 text-sm'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`p-4 border-t ${theme.border_color} ${theme.bg_card}`}>
                        <div className="relative">
                            <Textarea
                                className={`min-h-[60px] pr-12 resize-y border-2 ${theme.border_color} focus:outline-none ${theme.bg_card} ${theme.text_main}`}
                                placeholder="Tell the AI what to do..."
                                value={aiChatInput}
                                onChange={(e) => setAiChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendChatMessage();
                                    }
                                }}
                            />
                            <button
                                onClick={sendChatMessage}
                                className={`absolute right-2 bottom-2 p-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 hover:bg-gray-900'} text-white rounded-[10px] transition-all`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Preview or Generation */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className={`px-4 py-2 ${theme.bg_card} border-b ${theme.border_color} flex justify-between items-center`}>
                        <div className={`flex ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg p-1`}>
                            <button
                                onClick={() => setActiveTab('generation')}
                                className={`p-2 rounded-md transition-all ${activeTab === 'generation' ? `${theme.bg_main} text-white` : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'}`}`}
                                title="Code"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                            </button>
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`p-2 rounded-md transition-all ${activeTab === 'preview' ? `${theme.bg_main} text-white` : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'}`}`}
                                title="Preview"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        {renderMainContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading Project...</div>}>
        <ProjectPage />
      </Suspense>
    );
}