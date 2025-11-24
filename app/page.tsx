'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@/components/UserButton';
import Link from 'next/link';
import { ModelSelector } from '@/components/ModelSelector';

function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [promptInput, setPromptInput] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'minimax' | 'openrouter'>('minimax');
  const [submitting, setSubmitting] = useState(false);

  // Check for default model on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('preferred_model');
    if (!savedModel) {
      setShowModelSelector(true);
    } else {
      setSelectedModel(savedModel as 'minimax' | 'openrouter');
    }
  }, []);

  const handleModelSelect = (model: 'minimax' | 'openrouter') => {
    localStorage.setItem('preferred_model', model);
    setSelectedModel(model);
    setShowModelSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || submitting) return;

    if (!session) {
      alert('Please sign in to create a project');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Generated from: "${promptInput.substring(0, 30)}..."`,
          description: promptInput,
          prompt: promptInput,
          model: selectedModel
        })
      });

      if (!res.ok) throw new Error('Failed to create project');

      const project = await res.json();
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <ModelSelector isOpen={showModelSelector} onSelect={handleModelSelect} />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-screen w-full bg-background transition-none">
          {/* Background Gradients */}
          <div className="absolute inset-0 w-full overflow-hidden">
            <div className="absolute inset-0 mt-0 blur-[10px]" style={{ opacity: 1, transform: 'none' }}>
              <div
                className="absolute left-1/2 aspect-square w-[350%] -translate-x-1/2 overflow-hidden md:w-[190%] lg:w-[190%] xl:w-[190%] 2xl:mx-auto"
                style={{
                  backgroundImage: 'url(/img/background/gradient-optimized.webp)', // Note: You might need to add this asset or use a CSS gradient fallback
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center top',
                  mask: 'linear-gradient(to bottom, transparent 0%, black 5%, black 100%)',
                  WebkitMask: 'linear-gradient(to bottom, transparent 0%, black 5%, black 100%)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  perspective: '1000px',
                  WebkitPerspective: '1000px',
                  willChange: 'transform'
                }}
              />
            </div>
          </div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(/_next/static/media/grain.1ccdda41.png)', // Note: Asset needed
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
            opacity: 1,
            backgroundBlendMode: 'overlay',
            backgroundPosition: 'left top',
            mixBlendMode: 'overlay'
          }} />

          {/* Navigation */}
          <nav className="sticky top-0 z-50 flex w-full flex-col items-center justify-between border-b border-muted/25 bg-background/75 backdrop-blur-xl">
            <div className="container-home flex h-16 w-full items-center justify-between px-4 md:px-8">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <span className="flex flex-col gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 755 129" className="flex h-[22px]">
                      <path fill="#1B1B1B" d="M303.603 31.054q13.724 0 24.04 5.944 10.314 5.944 15.91 16.959 5.682 10.928 5.682 25.701 0 14.775-5.682 25.789-5.596 11.014-15.91 16.959-10.316 5.945-24.04 5.945-13.725 0-24.128-5.945-10.316-5.944-15.998-16.959-5.595-11.015-5.595-25.789 0-14.773 5.595-25.701 5.682-11.014 15.998-16.959 10.403-5.944 24.128-5.944m176.168 0q13.025 0 22.029 4.283 9.003 4.195 13.55 12.063 4.632 7.868 4.633 18.796v38.464q0 6.207.874 11.539.962 5.245 2.71 6.645v2.971H496.03q-.961-3.759-1.486-8.479a96 96 0 0 1-.298-3.178 33 33 0 0 1-2.149 2.828q-4.371 5.158-11.278 8.305-6.818 3.06-15.56 3.06-8.655 0-15.561-3.41-6.819-3.409-10.753-9.703-3.846-6.381-3.846-14.861 0-12.938 7.605-19.757 7.606-6.906 21.942-9.004l15.999-2.273q4.808-.7 7.605-1.748 2.797-1.05 4.108-2.798 1.312-1.836 1.312-4.633 0-2.885-1.573-5.245-1.487-2.448-4.546-3.847-2.972-1.486-7.256-1.486-6.82 0-10.928 3.585-4.109 3.497-4.458 9.615h-27.362q.35-9.266 5.595-16.434 5.332-7.256 14.773-11.278 9.441-4.02 21.856-4.02m78.465 15.935a31.3 31.3 0 0 1 3.148-4.92q4.196-5.334 10.227-8.132 6.033-2.884 13.55-2.884 11.278 0 19.582 5.857 8.306 5.858 12.764 16.872 4.458 10.928 4.458 25.964 0 14.949-4.546 25.963-4.546 10.927-13.025 16.784-8.392 5.858-19.669 5.858-7.518 0-13.463-2.622-5.857-2.623-9.966-7.869a31.2 31.2 0 0 1-3.321-5.4v13.355h-26.227V.456h26.488V46.99Zm152.215-15.935q12.85 0 22.817 5.594 9.966 5.595 15.473 16.26 5.595 10.666 5.595 25.527 0 5.332-.088 8.48h-63.814q.377 6.134 2.359 10.664 2.448 5.594 6.993 8.48 4.546 2.797 10.753 2.797 6.819 0 11.277-3.497 4.459-3.584 5.595-10.052h26.487q-1.223 10.14-6.905 17.571-5.595 7.43-14.949 11.452-9.354 4.021-21.768 4.021-13.986 0-24.302-5.332-10.316-5.421-16.085-16.26-5.682-10.84-5.682-26.838 0-15.21 5.944-26.226 5.944-11.101 16.435-16.872t23.865-5.77ZM207.915 100.6h32.087c23.362 0 20.196 25.162 20.189 25.215h-79.726V.456h27.45zm185.126-2.03 19.101-64.982h27.362l-31.908 92.227h-29.46l-33.132-92.227h28.148l19.889 64.981Zm263.245 27.245h-26.488V.456h26.488zM493.845 80.844a14 14 0 0 1-3.06 1.962q-3.06 1.485-8.305 2.535l-6.731 1.311q-6.731 1.311-10.141 4.02-3.322 2.711-3.322 7.606t3.584 7.781q3.585 2.885 9.18 2.885t9.878-2.448q4.283-2.535 6.556-6.993 2.361-4.459 2.361-10.14zm82.662-29.597q-5.858 0-10.053 3.584-4.109 3.497-6.207 9.966-2.098 6.382-2.098 14.95 0 8.653 2.098 15.034t6.207 9.879q4.195 3.497 10.053 3.497 5.945 0 9.966-3.497 4.108-3.496 6.119-9.879 2.097-6.381 2.098-15.035t-2.098-15.036q-2.011-6.382-6.119-9.879-4.021-3.585-9.966-3.584m-272.904.088q-5.77 0-9.966 3.234-4.109 3.147-6.295 9.529-2.185 6.294-2.185 15.56t2.185 15.649q2.186 6.381 6.295 9.616 4.196 3.146 9.966 3.146t9.877-3.146q4.11-3.234 6.294-9.53 2.186-6.381 2.186-15.735 0-13.899-4.808-21.067-4.808-7.256-13.549-7.256m406.237-1.137q-5.857 0-10.316 2.885-4.371 2.798-6.819 8.393-1.34 3.174-1.918 7.08h36.494q-.391-4.95-1.969-8.567-2.01-4.895-5.944-7.343t-9.528-2.448"></path>
                      {/* SVG Filters and Gradients omitted for brevity but should be included if possible or loaded as an asset */}
                    </svg>
                  </span>
                </Link>
                <nav className="hidden items-center gap-6 md:flex">
                  <Link href="#" className="text-sm font-normal text-foreground transition-colors hover:text-foreground/80">Solutions</Link>
                  <Link href="#" className="text-sm font-normal text-foreground transition-colors hover:text-foreground/80">Enterprise</Link>
                  <Link href="#" className="text-sm font-normal text-foreground transition-colors hover:text-foreground/80">Pricing</Link>
                  <Link href="#" className="text-sm font-normal text-foreground transition-colors hover:text-foreground/80">Community</Link>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                {session ? (
                  <UserButton />
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => signIn()} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-accent hover:border-accent h-8 rounded-md px-4 py-2">
                      Log in
                    </button>
                    <button onClick={() => signIn()} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-4 py-2">
                      Get started
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <main className="overflow-x-hidden overflow-y-hidden container-home">
            <div className="relative w-full">
              <section className="mb-[20px] flex w-full flex-col items-center justify-center py-[20vh] md:mb-0 2xl:py-64">
                <div className="relative mb-4 flex flex-col items-center px-4 text-center md:mb-6">
                  <div className="flex flex-col items-center">
                    <a target="_blank" rel="noopener noreferrer" className="group mb-6 flex items-center gap-2 rounded-full bg-muted/20 py-2 pe-3 ps-2 text-sm shadow-none transition-all duration-300 hover:bg-muted/100 hover:shadow-xl" href="#">
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-blue-50">New</span>
                      Themes & Visual edits
                    </a>
                  </div>
                  <h1 className="mb-2 flex items-center gap-1 text-3xl font-medium leading-none text-foreground sm:text-3xl md:mb-2.5 md:gap-0 md:text-5xl">
                    <span className="pt-0.5 tracking-tight md:pt-0">Build something <span className="md:sr-only">Lovable</span></span>
                    <div className="flex flex-col gap-1.5 ml-2 hidden sm:ml-3 md:ml-4 md:flex">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 755 129" className="flex h-[22px] sm:h-[28px] md:h-[36px]">
                        <path fill="#1B1B1B" d="M303.603 31.054q13.724 0 24.04 5.944 10.314 5.944 15.91 16.959 5.682 10.928 5.682 25.701 0 14.775-5.682 25.789-5.596 11.014-15.91 16.959-10.316 5.945-24.04 5.945-13.725 0-24.128-5.945-10.316-5.944-15.998-16.959-5.595-11.015-5.595-25.789 0-14.773 5.595-25.701 5.682-11.014 15.998-16.959 10.403-5.944 24.128-5.944m176.168 0q13.025 0 22.029 4.283 9.003 4.195 13.55 12.063 4.632 7.868 4.633 18.796v38.464q0 6.207.874 11.539.962 5.245 2.71 6.645v2.971H496.03q-.961-3.759-1.486-8.479a96 96 0 0 1-.298-3.178 33 33 0 0 1-2.149 2.828q-4.371 5.158-11.278 8.305-6.818 3.06-15.56 3.06-8.655 0-15.561-3.41-6.819-3.409-10.753-9.703-3.846-6.381-3.846-14.861 0-12.938 7.605-19.757 7.606-6.906 21.942-9.004l15.999-2.273q4.808-.7 7.605-1.748 2.797-1.05 4.108-2.798 1.312-1.836 1.312-4.633 0-2.885-1.573-5.245-1.487-2.448-4.546-3.847-2.972-1.486-7.256-1.486-6.82 0-10.928 3.585-4.109 3.497-4.458 9.615h-27.362q.35-9.266 5.595-16.434 5.332-7.256 14.773-11.278 9.441-4.02 21.856-4.02m78.465 15.935a31.3 31.3 0 0 1 3.148-4.92q4.196-5.334 10.227-8.132 6.033-2.884 13.55-2.884 11.278 0 19.582 5.857 8.306 5.858 12.764 16.872 4.458 10.928 4.458 25.964 0 14.949-4.546 25.963-4.546 10.927-13.025 16.784-8.392 5.858-19.669 5.858-7.518 0-13.463-2.622-5.857-2.623-9.966-7.869a31.2 31.2 0 0 1-3.321-5.4v13.355h-26.227V.456h26.488V46.99Zm152.215-15.935q12.85 0 22.817 5.594 9.966 5.595 15.473 16.26 5.595 10.666 5.595 25.527 0 5.332-.088 8.48h-63.814q.377 6.134 2.359 10.664 2.448 5.594 6.993 8.48 4.546 2.797 10.753 2.797 6.819 0 11.277-3.497 4.459-3.584 5.595-10.052h26.487q-1.223 10.14-6.905 17.571-5.595 7.43-14.949 11.452-9.354 4.021-21.768 4.021-13.986 0-24.302-5.332-10.316-5.421-16.085-16.26-5.682-10.84-5.682-26.838 0-15.21 5.944-26.226 5.944-11.101 16.435-16.872t23.865-5.77ZM207.915 100.6h32.087c23.362 0 20.196 25.162 20.189 25.215h-79.726V.456h27.45zm185.126-2.03 19.101-64.982h27.362l-31.908 92.227h-29.46l-33.132-92.227h28.148l19.889 64.981Zm263.245 27.245h-26.488V.456h26.488zM493.845 80.844a14 14 0 0 1-3.06 1.962q-3.06 1.485-8.305 2.535l-6.731 1.311q-6.731 1.311-10.141 4.02-3.322 2.711-3.322 7.606t3.584 7.781q3.585 2.885 9.18 2.885t9.878-2.448q4.283-2.535 6.556-6.993 2.361-4.459 2.361-10.14zm82.662-29.597q-5.858 0-10.053 3.584-4.109 3.497-6.207 9.966-2.098 6.382-2.098 14.95 0 8.653 2.098 15.034t6.207 9.879q4.195 3.497 10.053 3.497 5.945 0 9.966-3.497 4.108-3.496 6.119-9.879 2.097-6.381 2.098-15.035t-2.098-15.036q-2.011-6.382-6.119-9.879-4.021-3.585-9.966-3.584m-272.904.088q-5.77 0-9.966 3.234-4.109 3.147-6.295 9.529-2.185 6.294-2.185 15.56t2.185 15.649q2.186 6.381 6.295 9.616 4.196 3.146 9.966 3.146t9.877-3.146q4.11-3.234 6.294-9.53 2.186-6.381 2.186-15.735 0-13.899-4.808-21.067-4.808-7.256-13.549-7.256m406.237-1.137q-5.857 0-10.316 2.885-4.371 2.798-6.819 8.393-1.34 3.174-1.918 7.08h36.494q-.391-4.95-1.969-8.567-2.01-4.895-5.944-7.343t-9.528-2.448"></path>
                      </svg>
                    </div>
                  </h1>
                  <p className="mb-6 max-w-[25ch] text-center text-lg leading-tight text-foreground/65 md:max-w-full md:text-xl">Create apps and websites by chatting with AI</p>
                </div>

                <div className="w-full max-w-3xl">
                  <div className="relative w-full">
                    <div className="flex w-full flex-col items-center">
                      <div className="relative size-full">
                        <form onSubmit={handleSubmit} id="chat-input" className="group flex flex-col gap-2 p-3 w-full rounded-3.5xl border border-muted-border bg-muted text-base shadow-xl transition-all duration-150 ease-in-out focus-within:border-foreground/20 hover:border-foreground/10 focus-within:hover:border-foreground/20">
                          <div className="relative flex flex-1 items-center">
                            <textarea
                              value={promptInput}
                              onChange={(e) => setPromptInput(e.target.value)}
                              className="flex w-full rounded-md border border-input px-2 py-2 transition-colors duration-150 ease-in-out placeholder:text-muted-foreground hover:border-ring/20 focus-visible:border-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:border-input disabled:opacity-50 resize-none border-none text-[16px] leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[max(35svh,5rem)] bg-transparent focus:bg-transparent flex-1"
                              id="chatinput"
                              autoFocus
                              style={{ height: '80px' }}
                              placeholder="Ask Lovable to create a blog about..."
                              maxLength={50000}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmit(e);
                                }
                              }}
                            />
                          </div>
                          <div className="flex gap-1 flex-wrap items-center">
                            <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-accent hover:border-accent gap-1.5 h-10 w-10 rounded-full p-0 text-muted-foreground hover:text-foreground md:h-8 md:w-8" type="button">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-5 w-5 text-muted-foreground">
                                <path fill="currentColor" d="M11.25 18v-5.25H6a.75.75 0 0 1 0-1.5h5.25V6a.75.75 0 0 1 1.5 0v5.25H18a.75.75 0 0 1 0 1.5h-5.25V18a.75.75 0 0 1-1.5 0"></path>
                              </svg>
                            </button>
                            <div>
                              <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-accent hover:border-accent py-2 h-10 w-10 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground md:h-8 md:w-fit" type="button">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-4 w-4">
                                  <path fill="currentColor" d="M5.25 15V8a.75.75 0 0 1 1.5 0v7a5.25 5.25 0 1 0 10.5 0V7a3.25 3.25 0 0 0-6.5 0v8a1.25 1.25 0 1 0 2.5 0V8a.75.75 0 0 1 1.5 0v7a2.75 2.75 0 1 1-5.5 0V7a4.75 4.75 0 1 1 9.5 0v8a6.75 6.75 0 0 1-13.5 0"></path>
                                </svg>
                                <span className="hidden md:flex">Attach</span>
                              </button>
                            </div>
                            <div className="group/pill relative">
                              <button className="whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-accent hover:border-accent px-3 py-2 flex h-10 max-w-52 items-center justify-between gap-1 rounded-full text-muted-foreground group-hover/pill:border-accent group-hover/pill:bg-accent focus-visible:ring-0 md:h-8" type="button">
                                <div className="flex min-w-0 flex-1 items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-4 w-4 flex-shrink-0">
                                    <path fill="currentColor" d="M18.995 13.898a1 1 0 0 0-.928-.895L12.071 19H18a1 1 0 0 0 .995-.898L19 18v-4zm-4.303-7.419a1 1 0 0 0-1.414 0L13 6.757v8.486l4.52-4.521a1 1 0 0 0 0-1.414zM9.5 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M21 18a3 3 0 0 1-2.846 2.996L18 21H8a5 5 0 0 1-5-5V6a3 3 0 0 1 3-3h4c1.118 0 2.092.613 2.607 1.52a3 3 0 0 1 3.5.545l2.828 2.829a3 3 0 0 1 .544 3.498A3 3 0 0 1 21 14zM5 16a3 3 0 1 0 6 0V6a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1z"></path>
                                  </svg>
                                  <span className="truncate">Theme</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-4 w-4 flex-shrink-0">
                                  <path fill="currentColor" d="M11.526 15.582a.75.75 0 0 0 1.004-.052l5-5a.75.75 0 1 0-1.06-1.06L12 13.94 7.53 9.47a.75.75 0 1 0-1.06 1.06l5 5z"></path>
                                </svg>
                              </button>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                              <div className="relative flex items-center gap-1 md:gap-2">
                                <button type="submit" disabled={!promptInput.trim() || submitting} className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground transition-opacity duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:w-8">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-6 w-6 text-background">
                                    <path fill="currentColor" d="M11 19V7.415l-3.293 3.293a1 1 0 1 1-1.414-1.414l5-5 .074-.067a1 1 0 0 1 1.34.067l5 5a1 1 0 1 1-1.414 1.414L13 7.415V19a1 1 0 1 1-2 0"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* From the Community Section */}
              <div className="flex w-full flex-col gap-12 rounded-[20px] bg-background px-8 py-8">
                <div className="flex flex-col gap-5" id="from-the-community">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-2xl font-medium">From the Community</div>
                      <Link href="#" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-8 rounded-md px-4 py-2">
                        <span className="hidden sm:inline">View all</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%" className="shrink-0 h-6 w-6">
                          <path fill="currentColor" d="M9.47 6.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L13.94 12 9.47 7.53a.75.75 0 0 1 0-1.06"></path>
                        </svg>
                      </Link>
                    </div>
                    {/* Filter buttons omitted for brevity but can be added back */}
                  </div>

                  {/* Project Grid */}
                  <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(275px,1fr))] gap-5">
                    {/* Example Project Card 1 */}
                    <div className="w-full max-w-[400px]">
                      <div className="group relative flex flex-col">
                        <div className="relative mb-3 flex flex-col">
                          <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                            <div className="relative h-full w-full">
                              {/* Placeholder Image */}
                              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                                Project Preview
                              </div>
                              <div className="absolute inset-0 hidden cursor-pointer items-center justify-center bg-black/30 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 md:flex">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-muted-hover h-8 rounded-md px-4 py-2 pointer-events-none">
                                  Preview
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex overflow-hidden rounded-full shrink-0 items-center border border-transparent text-xs group-[.avatars]:border-background h-9 w-9">
                            <span className="flex h-full w-full justify-center rounded-full items-center border-none font-medium text-white bg-blue-500">P</span>
                          </div>
                          <div className="flex w-full min-w-0 items-center justify-between">
                            <div className="flex min-w-0 flex-col">
                              <div className="flex items-center gap-2 truncate">
                                <p className="overflow-hidden truncate whitespace-nowrap">naija-connect-platform</p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <p>12 Remixes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Add more project cards here as needed */}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <div className="container-home relative z-10 mb-4 mt-6 px-4 md:px-8">
            <footer className="rounded-2xl border border-muted-border bg-muted p-6 sm:p-8 md:p-10 lg:p-14">
              <nav className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
                <div className="col-span-2 flex h-full justify-between sm:col-span-3 lg:col-span-1 lg:flex-col">
                  <Link href="/" className="w-fit transition-transform hover:animate-[heartbeat_1s_ease-in-out]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 23 24" className="size-8">
                      <path fill="#1B1B1B" fillRule="evenodd" d="M6.898 0c3.81 0 6.898 3.179 6.898 7.1v2.7h2.295c3.81 0 6.898 3.178 6.898 7.1S19.901 24 16.091 24H0V7.1C0 3.18 3.088 0 6.898 0" clipRule="evenodd"></path>
                    </svg>
                  </Link>
                  <div className="hidden w-fit lg:block">
                    <button className="flex items-center gap-1 text-muted-foreground hover:underline disabled:opacity-50" type="button">
                      <span className="text-sm">EN</span>
                    </button>
                  </div>
                </div>
                {/* Footer columns */}
                <div className="space-y-4">
                  <h3 className="text-sm font-normal text-muted-foreground">Company</h3>
                  <ul className="space-y-3">
                    <li><Link href="#" className="group flex items-start text-sm text-primary transition-colors hover:text-muted-foreground">Careers</Link></li>
                    <li><Link href="#" className="group flex items-start text-sm text-primary transition-colors hover:text-muted-foreground">Press & media</Link></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-normal text-muted-foreground">Product</h3>
                  <ul className="space-y-3">
                    <li><Link href="#" className="group flex items-start text-sm text-primary transition-colors hover:text-muted-foreground">Pricing</Link></li>
                    <li><Link href="#" className="group flex items-start text-sm text-primary transition-colors hover:text-muted-foreground">Enterprise</Link></li>
                  </ul>
                </div>
              </nav>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}