import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProjectDatabase, GenerationDatabase } from '@/lib/database';
import JSZip from 'jszip';

// GET /api/download-project/[id] - Download project as ZIP
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const projectId = parseInt(id);
        const project = await ProjectDatabase.getProjectById(projectId);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get latest generation files
        const files = await GenerationDatabase.getLatestProjectFiles(projectId);

        if (files.length === 0) {
            return NextResponse.json(
                { error: 'No files to download' },
                { status: 404 }
            );
        }

        // Create ZIP
        const zip = new JSZip();

        // Add all files to ZIP
        files.forEach(file => {
            zip.file(file.file_path, file.file_content);
        });

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Return as downloadable file
        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}.zip"`
            }
        });

    } catch (error) {
        console.error('Error downloading project:', error);
        return NextResponse.json(
            { error: 'Failed to download project' },
            { status: 500 }
        );
    }
}
