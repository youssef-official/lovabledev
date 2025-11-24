'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@/components/UserButton';
import { Sparkles, ArrowRight, Search, Grid2X2, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [promptInput, setPromptInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user projects
  useEffect(() => {
    if (!session) {
      setProjectsLoading(false);
      return;
    }

    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects?limit=6&sortBy=updated_at&sortOrder=DESC');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchProjects();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || submitting) return;

    if (!session) {
      // Redirect to sign in
      alert('Please sign in to create a project');
      return;
    }

    setSubmitting(true);
    setLoading(true);

    try {
      // Create project
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Generated from: "${promptInput.substring(0, 30)}..."`,
          description: promptInput,
          prompt: promptInput
        })
      });

      if (!res.ok) throw new Error('Failed to create project');

      const project = await res.json();

      // Redirect to generation page
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
      setSubmitting(false);
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return past.toLocaleDateString();
  };

  return (
    <div className="min-h-screen w-full overflow-hidden lovable-gradient relative">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 gradient-blur-blue animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 gradient-blur-purple animate-float animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 gradient-blur-orange animate-float animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🧡</span>
            </div>
            <span className="text-white font-semibold text-xl hidden sm:inline">Lovable</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Solutions
            </button>
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Enterprise
            </button>
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </button>
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Community
            </button>
            <div className="glass-dark rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                  {session.user?.name ? `${session.user.name.split(' ')[0]}'s Lovable` : "Your Projects"}
                </h2>
              </div>

              {projectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 mb-4">No projects yet</p>
                  <p className="text-white/40 text-sm">Start by creating your first project above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-4 transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-full aspect-video bg-gray-800/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        <Grid2X2 className="w-12 h-12 text-white/20" />
                      </div>

                      <h3 className="text-white font-medium mb-1 truncate">
                        {project.name}
                      </h3>
                      <p className="text-white/60 text-sm mb-2 line-clamp-2">
                        {project.description || 'No description'}
                      </p>

                      <div className="flex items-center gap-2 text-white/40 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(project.updated_at)}
                      </div>

                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-500/0 to-pink-600/0 group-hover:from-orange-500/10 group-hover:to-pink-600/10 transition-all duration-300 pointer-events-none" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </div>
      </section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center lovable-gradient">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}