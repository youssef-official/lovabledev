'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

interface FileTreeProps {
    files: Array<{ path: string; content: string; type: string }>;
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));

    // Build tree structure from flat file list
    const buildTree = (files: Array<{ path: string }>): FileNode[] => {
        const root: FileNode[] = [];
        const folderMap = new Map<string, FileNode>();

        files.forEach(file => {
            const parts = file.path.split('/');
            let currentPath = '';

            parts.forEach((part, index) => {
                const previousPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const isFile = index === parts.length - 1;

                if (!folderMap.has(currentPath)) {
                    const node: FileNode = {
                        name: part,
                        path: currentPath,
                        type: isFile ? 'file' : 'folder',
                        children: isFile ? undefined : []
                    };

                    folderMap.set(currentPath, node);

                    if (previousPath) {
                        const parent = folderMap.get(previousPath);
                        parent?.children?.push(node);
                    } else {
                        root.push(node);
                    }
                }
            });
        });

        return root;
    };

    const tree = buildTree(files);

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const renderNode = (node: FileNode, depth: number = 0) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedFile === node.path;

        if (node.type === 'folder') {
            return (
                <div key={node.path}>
                    <div
                        onClick={() => toggleFolder(node.path)}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer rounded text-sm"
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-white/60" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-white/60" />
                        )}
                        {isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-blue-400" />
                        ) : (
                            <Folder className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-white/90">{node.name}</span>
                    </div>
                    {isExpanded && node.children && (
                        <div>
                            {node.children.map(child => renderNode(child, depth + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div
                key={node.path}
                onClick={() => onSelectFile(node.path)}
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-sm ${isSelected ? 'bg-blue-500/20 text-white' : 'hover:bg-white/5 text-white/80'
                    }`}
                style={{ paddingLeft: `${depth * 12 + 24}px` }}
            >
                <File className="w-4 h-4" />
                <span>{node.name}</span>
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto scrollbar-hide p-2">
            <div className="text-white/60 text-xs font-semibold mb-2 px-2">FILES</div>
            {tree.map(node => renderNode(node))}
        </div>
    );
}
