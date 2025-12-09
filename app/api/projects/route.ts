import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProjectDatabase } from '@/lib/database';
import { UserDatabase } from '@/lib/database';

// GET /api/projects - Get all projects for logged-in user
export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from database
    const user = await UserDatabase.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = (searchParams.get('sortBy') as any) || 'updated_at';
    const sortOrder = (searchParams.get('sortOrder') as any) || 'DESC';

    const result = await ProjectDatabase.getUserProjects(user.id, {
      search,
      status,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from database
    const user = await UserDatabase.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, prompt, code, model } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate project name if not provided
    const projectName = name || `Project ${new Date().toISOString().split('T')[0]}`;

    const project = await ProjectDatabase.createProject({
      userId: user.id,
      name: projectName,
      description,
      prompt,
      code,
      model
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create project', details: errorMessage },
      { status: 500 }
    );
  }
}
