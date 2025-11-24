'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface E2BPreviewProps {
    sandboxUrl?: string;
    projectId: string;
}

export function E2BPreview({ sandboxUrl, projectId }: E2BPreviewProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
    }, [sandboxUrl]);

    const handleLoad = () => {
        setLoading(false);
        setError(null);
    };

    const handleError = () => {
        setLoading(false);
        setError('Failed to load preview. The sandbox may not be ready yet.');
    };

    const refresh = () => {
        setKey(prev => prev + 1);
        setLoading(true);
        setError(null);
    };

    if (!sandboxUrl) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                    </div>
                    <div className="text-white/60 text-sm">Creating sandbox...</div>
                    <div className="text-white/40 text-xs mt-1">This may take a moment</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full relative bg-gray-900">
            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                        <div className="text-white/60 text-sm">Loading preview...</div>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                    <div className="text-center max-w-md px-4">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <div className="text-white/90 text-sm mb-2">{error}</div>
                        <button
                            onClick={refresh}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Refresh button */}
            {!loading && !error && (
                <button
                    onClick={refresh}
                    className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors z-20"
                    title="Refresh preview"
                >
                    <RefreshCw className="w-4 h-4 text-white/80" />
                </button>
            )}

            {/* Preview iframe */}
            <iframe
                key={key}
                src={sandboxUrl}
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
            />
        </div>
    );
}
