// OpenRouter API Integration - Supports multiple models (GPT-4, Claude, etc.)

export interface GeneratedFile {
    path: string;
    content: string;
    type: string;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    usage?: {
        total_tokens: number;
    };
}

export async function* generateCodeWithOpenRouter(
    prompt: string,
    model: string = 'minimax/minimax-m2',
    onThinking?: (duration: number) => void
): AsyncGenerator<{
    type: 'thinking' | 'thinking_longer' | 'generating' | 'file' | 'complete';
    message?: string;
    file?: GeneratedFile;
    totalFiles?: number;
    thinkingDuration?: number;
}> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
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
- Configuration files (package.json, vite.config.ts, tsconfig.json, etc.)
- README.md with setup instructions

Make sure the code is complete, modern, and follows best practices. The project should be ready to run immediately after installation.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'Lovable Clone'
            },
            body: JSON.stringify({
                model: model,
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
                temperature: 0.7,
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
        }

        const data: OpenRouterResponse = await response.json();
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

        // Ensure we have essential files
        ensureEssentialFiles(files, prompt);

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
        console.error('OpenRouter generation error:', error);
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
    const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*)?(?:file:\s*)?([^\n]*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        const [, language, filename, code] = match;
        const type = language || 'typescript';

        // Use provided filename or generate one
        const finalFilename = filename.trim() || `generated-${files.length}.${getExtensionFromType(type)}`;

        files.push({
            path: finalFilename.startsWith('src/') ? finalFilename : `src/${finalFilename}`,
            content: code.trim(),
            type
        });
    }

    return files;
}

function ensureEssentialFiles(files: GeneratedFile[], prompt: string) {
    // Check for package.json
    const hasPackageJson = files.some(f => f.path.includes('package.json'));
    if (!hasPackageJson) {
        files.push({
            path: 'package.json',
            type: 'json',
            content: JSON.stringify({
                name: 'generated-app',
                version: '0.1.0',
                private: true,
                type: 'module',
                scripts: {
                    dev: 'vite',
                    build: 'tsc && vite build',
                    preview: 'vite preview'
                },
                dependencies: {
                    react: '^18.3.1',
                    'react-dom': '^18.3.1'
                },
                devDependencies: {
                    '@types/react': '^18.3.12',
                    '@types/react-dom': '^18.3.1',
                    '@vitejs/plugin-react': '^4.3.4',
                    typescript: '^5.7.2',
                    vite: '^6.0.5'
                }
            }, null, 2)
        });
    }

    // Check for vite.config
    const hasViteConfig = files.some(f => f.path.includes('vite.config'));
    if (!hasViteConfig) {
        files.push({
            path: 'vite.config.ts',
            type: 'typescript',
            content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
        });
    }

    // Check for  index.html
    const hasIndexHtml = files.some(f => f.path.includes('index.html'));
    if (!hasIndexHtml) {
        files.push({
            path: 'index.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        });
    }
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

// Available models
export const AVAILABLE_MODELS = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
];

// Helper function for non-streaming generation
export async function generateCodeSimple(
    prompt: string,
    model?: string
): Promise<{
    files: GeneratedFile[];
    thinkingDuration: number;
}> {
    const files: GeneratedFile[] = [];
    let thinkingDuration = 0;

    for await (const event of generateCodeWithOpenRouter(prompt, model, (duration) => {
        thinkingDuration = duration;
    })) {
        if (event.type === 'file' && event.file) {
            files.push(event.file);
        }
    }

    return { files, thinkingDuration };
}
