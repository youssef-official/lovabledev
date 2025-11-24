'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'link';
import { FileTree } from '@/components/FileTree';
import { CodeEditor } from '@/components/CodeEditor';
import { ThinkingDisplay } from '@/components/ThinkingDisplay';
import { E2BPreview } from '@/components/E2BPreview';
import { UserButton } from '@/components/UserButton';

interface GeneratedFile {
    path: string;
    content: string;
    type: string;
}

function GenerationPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const [files, setFiles] = useState<GeneratedFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingDuration, setThinkingDuration] = useState<number>();
    const [message, setMessage] = useState<string>();
    const [loading, setLoading] = useState(true);

    // Fetch project data
    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                if (!res.ok) throw new Error('Project not found');
                const data = await res.json();
                setProject(data);
            } catch (error) {
                console.error('Error fetching project:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        }

        fetchProject();
    }, [projectId, router]);

    // Start generation when project loads
    useEffect(() => {
        if (!project || files.length > 0) return;

        async function startGeneration() {
            try {
                const response = await fetch('/api/generate-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: project.id,
                        prompt: project.prompt,
                        model: 'openrouter'
                    })
                });

                if (!response.ok) throw new Error('Generation failed');

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event = JSON.parse(line.slice(6));

                                switch (event.type) {
                                    case 'thinking':
                                        setIsThinking(true);
                                        setMessage(event.message);
                                        break;

                                    case 'thinking_longer':
                                        setThinkingDuration(event.thinkingDuration);
                                        break;

                                    case 'generating':
                                        setIsThinking(false);
                                        setIsGenerating(true);
                                        setMessage(event.message);
                                        break;

                                    case 'file':
                                        if (event.file) {
                                            setFiles(prev => [...prev, event.file]);
                                            if (!selectedFile) {
                                                setSelectedFile(event.file.path);
                                            }
                                        }
                                        break;

                                    case 'complete':
                                        setIsGenerating(false);
                                        setIsThinking(false);
                                        break;

                                    case 'error':
                                        setIsGenerating(false);
                                        setIsThinking(false);
                                        console.error('Generation error:', event.message);
                                        break;
                                }
                            } catch (e) {
                                console.error('Failed to parse event:', e);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Generation error:', error);
                setIsGenerating(false);
                setIsThinking(false);
            }
        }

        startGeneration();
    }, [project, files.length, selectedFile]);

    const handleDownload = async () => {
        // TODO: Implement download functionality
        console.log('Downloading project...');
    };

    const selectedFileData = files.find(f => f.path === selectedFile);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-950">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">🧡</span>
                        </div>
                        <div>
                            <h1 className="text-white font-semibold">{project.name}</h1>
                            <p className="text-white/40 text-xs">{project.description || 'No description'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDownload}
                        disabled={files.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                    <UserButton />
                </div>
            </header>

            {/* Thinking Display */}
            {(isThinking || isGenerating) && (
                <div className="px-6 py-3 bg-gray-900 border-b border-white/10">
                    <ThinkingDisplay
                        isThinking={isThinking}
                        isGenerating={isGenerating}
                        thinkingDuration={thinkingDuration}
                        message={message}
                    />
                </div>
            )}

            {/* Main Content - 3 Panels */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - File Tree */}
                <div className="w-64 bg-gray-900 border-r border-white/10 overflow-hidden">
                    {files.length > 0 ? (
                        <FileTree
                            files={files}
                            selectedFile={selectedFile}
                            onSelectFile={setSelectedFile}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/40 text-sm">
                            {isThinking || isGenerating ? 'Generating files...' : 'No files yet'}
                        </div>
                    )}
                </div>

                {/* Middle Panel - Code Editor */}
                <div className="flex-1 overflow-hidden">
                    {selectedFileData ? (
                        <CodeEditor
                            code={selectedFileData.content}
                            language={selectedFileData.type}
                            filename={selectedFileData.path}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-white/40 text-sm">
                            {isThinking || isGenerating ? 'Generating code...' : 'Select a file to view'}
                        </div>
                    )}
                </div>

                {/* Right Panel - Preview */}
                <div className="w-1/3 border-l border-white/10 overflow-hidden">
                    <E2BPreview
                        sandboxUrl={project.sandbox_url}
                        projectId={projectId}
                    />
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        }>
            <GenerationPage />
        </Suspense>
    );
}
