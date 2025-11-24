'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
    code: string;
    language: string;
    filename: string;
}

const getLanguageFromType = (type: string): string => {
    const map: Record<string, string> = {
        typescript: 'typescript',
        javascript: 'javascript',
        tsx: 'tsx',
        jsx: 'jsx',
        css: 'css',
        html: 'html',
        json: 'json',
        markdown: 'markdown'
    };
    return map[type] || 'typescript';
};

const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop() || '';
    return getLanguageFromType(ext);
};

export function CodeEditor({ code, language, filename }: CodeEditorProps) {
    const lang = language || getLanguageFromFilename(filename);

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* File tab */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d30] border-b border-white/10">
                <span className="text-white/90 text-sm font-medium">{filename}</span>
            </div>

            {/* Code content */}
            <div className="flex-1 overflow-auto scrollbar-hide">
                <SyntaxHighlighter
                    language={lang}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{
                        margin: 0,
                        padding: '16px',
                        background: '#1e1e1e',
                        fontSize: '14px',
                        lineHeight: '1.6'
                    }}
                    lineNumberStyle={{
                        minWidth: '3em',
                        paddingRight: '1em',
                        color: '#858585',
                        userSelect: 'none'
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
