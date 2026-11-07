import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Layers,
  ChevronRight,
  ExternalLink,
  Github,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPublicProjectsList } from '@/lib/supabase';
import ProjectsClientGallery from './ProjectsClientGallery';

export const metadata: Metadata = {
  title: 'Projects & Ventures | Mohd Shifan Gouri (BOYS MSG) — POKEDEVS',
  description:
    'Explore production systems, Minecraft server architectures, open-source modpacks, and developer platforms built by Mohd Shifan Gouri (BOYS MSG).',
  openGraph: {
    title: 'Projects & Ventures | Mohd Shifan Gouri (BOYS MSG) — POKEDEVS',
    description:
      'Production systems, Minecraft architectures, and web platforms built by Mohd Shifan Gouri.',
    url: 'https://shifan.pokefun.in/projects',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projects & Ventures | Mohd Shifan Gouri (BOYS MSG)',
    description:
      'Production systems, Minecraft architectures, and web platforms built by Mohd Shifan Gouri.',
  },
  alternates: {
    canonical: 'https://shifan.pokefun.in/projects',
  },
};

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getPublicProjectsList();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-electric-blue selection:text-white">
      <Navbar activeSection="projects" />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
            <Link href="/" className="hover:text-electric-blue transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-electric-blue font-semibold">Projects</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-ice border border-electric-blue/20 text-electric-blue text-xs font-semibold mb-3">
                <Layers className="w-3.5 h-3.5" />
                <span>Ecosystem & Ventures</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-midnight-900 tracking-tight">
                Featured Projects & Architecture
              </h1>
              <p className="mt-2 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Live platforms, high-tickrate game server infrastructure, open-source modpacks, and modern full-stack web applications.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                href="/journal"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-electric-blue/40 hover:text-electric-blue transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Dev Journal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Client Gallery with Filtering */}
        <ProjectsClientGallery initialProjects={projects} />
      </main>

      <Footer />
    </div>
  );
}
