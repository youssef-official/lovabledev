import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserDatabase, ProjectDatabase, GenerationDatabase } from '@/lib/database';
import { generateCodeWithMinimax } from '@/lib/ai/minimax';
import { generateCodeWithOpenRouter } from '@/lib/ai/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/generate-code - Generate code with streaming
export async function POST(request: Request) {
    const encoder = new TextEncoder();

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
        const { projectId, prompt, model } = body;

        if (!projectId || !prompt) {
            return NextResponse.json(
                { error: 'Project ID and prompt are required' },
                { status: 400 }
            );
        }

        // Verify project belongs to user
        const project = await ProjectDatabase.getProjectById(parseInt(projectId));
        if (!project || project.user_id !== user.id) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Create generation record
        const generation = await GenerationDatabase.createGeneration({
            projectId: parseInt(projectId),
            userId: user.id,
            prompt,
            model: model || 'openrouter'
        });

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const thinkingStart = Date.now();
                    let thinkingDuration = 0;

                    // Choose AI provider
                    const generator = model === 'minimax'
                        ? generateCodeWithMinimax(prompt, (duration) => {
                            thinkingDuration = duration;
                        })
                        : generateCodeWithOpenRouter(prompt, undefined, (duration) => {
                            thinkingDuration = duration;
                        });

                    const generatedFiles: any[] = [];

                    // Stream events
                    for await (const event of generator) {
                        // Send event to client
                        const data = JSON.stringify(event);
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                        // Update generation status
                        if (event.type === 'thinking') {
                            await GenerationDatabase.updateGenerationStatus(generation.id, 'thinking');
                        } else if (event.type === 'generating') {
                            await GenerationDatabase.updateGenerationStatus(generation.id, 'generating');
                        } else if (event.type === 'file' && event.file) {
                            generatedFiles.push(event.file);
                        } else if (event.type === 'complete') {
                            // Save all files to database
                            if (generatedFiles.length > 0) {
                                await GenerationDatabase.addGeneratedFiles(
                                    generation.id,
                                    generatedFiles.map(f => ({
                                        filePath: f.path,
                                        fileContent: f.content,
                                        fileType: f.type
                                    }))
                                );
                            }

                            // Update generation as complete
                            await GenerationDatabase.updateGenerationStatus(
                                generation.id,
                                'complete',
                                { thinkingDuration }
                            );
                        }
                    }

                    controller.close();
                } catch (error: any) {
                    console.error('Generation error:', error);

                    // Update generation as failed
                    await GenerationDatabase.updateGenerationStatus(
                        generation.id,
                        'failed',
                        { errorMessage: error.message }
                    );

                    const errorData = JSON.stringify({
                        type: 'error',
                        message: error.message || 'Generation failed'
                    });
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate code' },
            { status: 500 }
        );
    }
}
