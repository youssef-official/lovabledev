'use client';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { UserButton } from '@/components/UserButton';
import { Sparkles, ArrowRight, Search, Grid2X2, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function HomePage() {
  const { data: session } = useSession();
  const [promptInput, setPromptInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    // Navigate to generation page or handle prompt
    console.log('Submitted:', promptInput);
  };

  // Mock projects data - replace with real data from your backend
  const recentProjects = [
    {
      id: 1,
      name: 'pharaoh-health-chat',
      lastEdited: '2 hours ago',
      preview: 'Health chat application'
    },
    {
      id: 2,
      name: 'ecommerce-dashboard',
      lastEdited: '1 day ago',
      preview: 'Admin dashboard for e-commerce'
    },
    {
      id: 3,
      name: 'portfolio-website',
      lastEdited: '3 days ago',
      preview: 'Personal portfolio site'
    }
  ];

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🧡</span>
            </div>
            <span className="text-white font-semibold text-xl hidden sm:inline">Lovable</span>
          </Link>

          {/* Navigation */}
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
          </nav>

          {/* User Button */}
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-32">
        {/* Hero Section */}
        <div className="max-w-4xl w-full text-center mb-12 animate-fade-in-up">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark mb-6">
              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-semibold">New</span>
              <span className="text-white/90 text-sm">Themes & Visual edits</span>
              <ArrowRight className="w-4 h-4 text-white/70" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Build something{' '}
              <span className="inline-flex items-center">
                <span className="text-orange-400">🧡</span>{' '}
                Lovable
              </span>
            </h1>

            <p className="text-xl text-white/80 mb-12">
              Create apps and websites by chatting with AI
            </p>
          </motion.div>

          {/* Chat Input Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <form onSubmit={handleSubmit}>
              <div className="relative w-full max-w-3xl mx-auto">
                <div className="glass-dark rounded-2xl p-6 shadow-2xl">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Ask Lovable to create a blog about..."
                    className="w-full bg-transparent text-white placeholder-white/40 border-none outline-none resize-none text-lg min-h-[60px]"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attach
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Theme
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 text-sm border border-green-500/30"
                      >
                        <Sparkles className="w-4 h-4" />
                        Supabase
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>

                      <button
                        type="submit"
                        className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                        disabled={!promptInput.trim()}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      {/* Projects Section */}
      <section className="relative z-10 w-full px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="glass-dark rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                {session?.user?.name ? `${session.user.name.split(' ')[0]}'s Lovable` : "Your Projects"}
              </h2>
              <button className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm">
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-white/5 text-white placeholder-white/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <select className="bg-white/5 text-white border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-white/30 transition-colors">
                  <option value="last-edited">Last edited</option>
                  <option value="name">Name</option>
                  <option value="created">Created</option>
                </select>

                <select className="bg-white/5 text-white border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-white/30 transition-colors">
                  <option value="all">All creators</option>
                  <option value="me">My projects</option>
                  <option value="shared">Shared with me</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-4 transition-all duration-300 cursor-pointer"
                >
                  {/* Project Preview */}
                  <div className="w-full aspect-video bg-gray-800/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    <Grid2X2 className="w-12 h-12 text-white/20" />
                  </div>

                  {/* Project Info */}
                  <h3 className="text-white font-medium mb-1 truncate">
                    {project.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-2 truncate">
                    {project.preview}
                  </p>

                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Clock className="w-3 h-3" />
                    {project.lastEdited}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-500/0 to-pink-600/0 group-hover:from-orange-500/10 group-hover:to-pink-600/10 transition-all duration-300 pointer-events-none" />
                </Link>
              ))}

              {/* Create New Project Card */}
              <button className="group relative bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/40 rounded-lg p-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-white/80 font-medium">New Project</span>
                <span className="text-white/40 text-sm mt-1">Start from scratch</span>
              </button>
            </div>
          </div>
        </div>
      </section>
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