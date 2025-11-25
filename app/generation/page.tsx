'use client';

import React, { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { E2BPreview } from '@/components/E2BPreview';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GenerationPage = () => {
  const [code, setCode] = useState('');
  const [alertInfo, setAlertInfo] = useState<{ type: 'default' | 'destructive'; title: string; message: string } | null>(null);
  const [model, setModel] = useState('claude-3-opus-20240229');
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sandboxUrl, setSandboxUrl] = useState('');
  const [projectName, setProjectName] = useState('');

  const handleGenerate = async () => {
    const response = await fetch('/api/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, prompt, imageUrl }),
    });

    const data = await response.json();
    setCode(data.code);
    setSandboxUrl(data.sandboxUrl);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'index.html';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const handleSaveProject = async () => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName || `Project ${new Date().toISOString()}`,
        prompt,
        code,
      }),
    });

    if (response.ok) {
      setAlertInfo({ type: 'default', title: 'Success', message: 'Project saved successfully!' });
    } else {
      setAlertInfo({ type: 'destructive', title: 'Error', message: 'Failed to save project.' });
    }
    setTimeout(() => setAlertInfo(null), 5000); // Auto-hide after 5 seconds
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <div className="flex-1 flex flex-col p-4 space-y-4 md:w-1/2">
        <div className="flex-1 flex flex-col space-y-4">
          {alertInfo && (
            <Alert variant={alertInfo.type}>
              <AlertTitle>{alertInfo.title}</AlertTitle>
              <AlertDescription>{alertInfo.message}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <Select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="gpt-4">GPT-4</option>
            </Select>
            <Input
              type="text"
              placeholder="Enter a prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 w-full"
            />
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target && typeof event.target.result === 'string') {
                      setImageUrl(event.target.result);
                    }
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
              className="w-full"
            />
            <Button onClick={handleGenerate} className="w-full md:w-auto">Generate</Button>
            <Button onClick={handleDownload} className="w-full md:w-auto">Download</Button>
            <Input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full md:w-auto"
            />
            <Button onClick={handleSaveProject} className="w-full md:w-auto">Save Project</Button>
          </div>
          <div className="flex-1">
            <CodeEditor
              code={code}
              filename="index.html"
              language="html"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 md:w-1/2">
        <E2BPreview sandboxUrl={sandboxUrl} projectId="new-generation" />
      </div>
    </div>
  );
};

export default GenerationPage;