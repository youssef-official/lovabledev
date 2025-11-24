// MiniMax M2 API Integration for Code Generation

interface MinimaxResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    usage?: {
        total_tokens: number;
    };
}

export interface GeneratedFile {
    path: string;
    content: string;
    type: string;
}

export async function* generateCodeWithMinimax(
    prompt: string,
    onThinking?: (duration: number) => void
): AsyncGenerator<{
    type: 'thinking' | 'thinking_longer' | 'generating' | 'file' | 'complete';
    message?: string;
    file?: GeneratedFile;
    totalFiles?: number;
    thinkingDuration?: number;
}> {
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
        throw new Error('MINIMAX_API_KEY not configured');
    }

    const thinkingStartTime = Date.now();

    // Emit thinking state
    yield { type: 'thinking', message: 'Analyzing your request...' };

    try {
        const systemPrompt = `You are an expert code generator. Generate complete, production-ready code based on the user's request.

IMPORTANT: Format your response as follows:
1. First, explain your plan briefly
2. Then, for each file, use this exact format:

<file path="src/App.tsx" type="typescript">
[file content here]
</file>

<file path="src/index.css" type="css">
[file content here]
</file>

Generate all necessary files including:
- Main application files
- Components
- Styles (CSS/Tailwind)
- Configuration files (package.json, vite.config.ts, etc.)
- README.md

Make sure the code is complete and can run immediately.`;

        const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'abab6.5s-chat',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                stream: false,
                temperature: 0.7,
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            throw new Error(`MiniMax API error: ${response.statusText}`);
        }

        const data: MinimaxResponse = await response.json();
        const content = data.choices[0]?.message?.content || '';

        const thinkingDuration = Date.now() - thinkingStartTime;

        // Emit thinking duration
        if (onThinking) {
            onThinking(thinkingDuration);
        }

        if (thinkingDuration > 3000) {
            yield { type: 'thinking_longer', thinkingDuration };
        }

        // Emit generating state
        yield { type: 'generating', message: 'Writing code...' };

        // Parse files from response
        const files = parseGeneratedFiles(content);

        // Emit each file
        for (const file of files) {
            yield { type: 'file', file, message: `Created ${file.path}` };
        }

        // Emit complete
        yield {
            type: 'complete',
            totalFiles: files.length,
            thinkingDuration
        };

    } catch (error) {
        console.error('MiniMax generation error:', error);
        throw error;
    }
}

function parseGeneratedFiles(content: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Match <file> tags
    const fileRegex = /<file\s+path="([^"]+)"\s+type="([^"]+)"\s*>([\s\S]*?)<\/file>/g;
    let match;

    while ((match = fileRegex.exec(content)) !== null) {
        const [, path, type, fileContent] = match;
        files.push({
            path: path.trim(),
            content: fileContent.trim(),
            type: type.trim()
        });
    }

    // If no files found, try to extract code blocks
    if (files.length === 0) {
        files.push(...extractCodeBlocks(content));
    }

    return files;
}

function extractCodeBlocks(content: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    let match;
    let fileIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        const [, language, code] = match;
        const type = language || 'typescript';

        // Try to determine filename from context
        const contextBefore = content.substring(Math.max(0, match.index - 100), match.index);
        const filenameMatch = contextBefore.match(/(?:file|path|name):\s*([^\s\n]+)/i);

        const filename = filenameMatch
            ? filenameMatch[1]
            : `file-${fileIndex}.${getExtensionFromType(type)}`;

        files.push({
            path: `src/${filename}`,
            content: code.trim(),
            type
        });

        fileIndex++;
    }

    return files;
}

function getExtensionFromType(type: string): string {
    const extensions: Record<string, string> = {
        'typescript': 'tsx',
        'javascript': 'jsx',
        'css': 'css',
        'html': 'html',
        'json': 'json',
        'markdown': 'md'
    };
    return extensions[type] || 'txt';
}

// Helper function for non-streaming generation
export async function generateCodeSimple(prompt: string): Promise<{
    files: GeneratedFile[];
    thinkingDuration: number;
}> {
    const files: GeneratedFile[] = [];
    let thinkingDuration = 0;

    for await (const event of generateCodeWithMinimax(prompt, (duration) => {
        thinkingDuration = duration;
    })) {
        if (event.type === 'file' && event.file) {
            files.push(event.file);
        }
    }

    return { files, thinkingDuration };
}
