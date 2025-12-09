import { NextResponse } from 'next/server';
import { Sandbox } from '@e2b/sdk';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, prompt, imageUrl } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const userMessage: any = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    };

    if (imageUrl) {
      userMessage.content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [userMessage],
      model,
    });

    const generatedCode = chatCompletion.choices[0]?.message?.content || '';

    const sandbox = await Sandbox.create({ template: 'base' });
    await sandbox.filesystem.write('index.html', generatedCode);
    const sandboxUrl = sandbox.getHostname();

    return NextResponse.json({
      code: generatedCode,
      sandboxUrl: `https://${sandboxUrl}`,
    });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
