const project = await ProjectDatabase.getProjectById(projectId);

if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
}

}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
    request: Request,
    } catch (error) {
}
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        const { id } = await params;
