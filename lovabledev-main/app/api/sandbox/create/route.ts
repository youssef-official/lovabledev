import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserDatabase, ProjectDatabase } from '@/lib/database';
import { createSandbox } from '@/lib/e2b/sandbox';

// POST /api/sandbox/create - Create E2B sandbox for a project
export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await UserDatabase.getUserByGoogleId(session.user.email);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { projectId, files } = body;

        if (!projectId || !files || files.length === 0) {
            return NextResponse.json(
                { error: 'Project ID and files are required' },
                { status: 400 }
            );
        }

        // Verify project belongs to user
        const project = await ProjectDatabase.getProjectById(parseInt(projectId));
        if (!project || project.user_id !== user.id) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Create sandbox
        const sandbox = await createSandbox(project.id.toString(), files);

        // Update project with sandbox info
        await ProjectDatabase.updateProject(project.id, {
            sandbox_id: sandbox.id,
            sandbox_url: sandbox.url
        });

        return NextResponse.json(sandbox);
    } catch (error: any) {
        console.error('Sandbox creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create sandbox' },
            { status: 500 }
        );
    }
}
