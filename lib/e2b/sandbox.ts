// E2B Sandbox Integration
// Creates and manages E2B sandboxes for live code preview

export interface SandboxFile {
    path: string;
    content: string;
}

export interface E2BSandbox {
    id: string;
    url: string;
}

export async function createSandbox(projectId: string, files: SandboxFile[]): Promise<E2BSandbox> {
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        throw new Error('E2B_API_KEY not configured');
    }

    try {
        // Create sandbox with Vite React template
        const response = await fetch('https://api.e2b.dev/sandboxes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template: 'react-vite',
                timeout: 30 * 60 // 30 minutes
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create sandbox: ${response.statusText}`);
        }

        const sandbox = await response.json();

        // Upload files to sandbox
        await uploadFiles(sandbox.id, files);

        // Install dependencies
        await runCommand(sandbox.id, 'npm install');

        // Start dev server
        await runCommand(sandbox.id, 'npm run dev', true); // Background process

        // Get preview URL
        const previewUrl = `https://${sandbox.id}.e2b.dev`;

        return {
            id: sandbox.id,
            url: previewUrl
        };
    } catch (error) {
        console.error('E2B sandbox creation error:', error);
        throw error;
    }
}

export async function uploadFiles(sandboxId: string, files: SandboxFile[]): Promise<void> {
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        throw new Error('E2B_API_KEY not configured');
    }

    try {
        for (const file of files) {
            const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: file.path,
                    content: file.content
                })
            });

            if (!response.ok) {
                console.error(`Failed to upload file ${file.path}:`, response.statusText);
            }
        }
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
}

export async function runCommand(
    sandboxId: string,
    command: string,
    background: boolean = false
): Promise<string> {
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        throw new Error('E2B_API_KEY not configured');
    }

    try {
        const response = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/commands`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command,
                background
            })
        });

        if (!response.ok) {
            throw new Error(`Command failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.output || '';
    } catch (error) {
        console.error('Command execution error:', error);
        throw error;
    }
}

export async function updateSandboxFiles(
    sandboxId: string,
    files: SandboxFile[]
): Promise<void> {
    await uploadFiles(sandboxId, files);

    // Vite has hot reload, so files will update automatically
    // No need to restart the dev server
}

export async function deleteSandbox(sandboxId: string): Promise<void> {
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        throw new Error('E2B_API_KEY not configured');
    }

    try {
        await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
    } catch (error) {
        console.error('Sandbox deletion error:', error);
        throw error;
    }
}
