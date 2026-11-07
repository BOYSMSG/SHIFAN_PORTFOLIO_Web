import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  Pin,
  Tag,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  GitCommit,
  Terminal,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPublicJournalEntries } from '@/lib/supabase';
import JournalClientFilter from './JournalClientFilter';

export const metadata: Metadata = {
  title: 'Developer Journal | Mohd Shifan Gouri (BOYS MSG) — POKEDEVS',
  description:
    'Chronological public development updates, features built, infrastructure engineering, bug fixes, and milestones by Mohd Shifan Gouri (BOYS MSG).',
  openGraph: {
    title: 'Developer Journal | Mohd Shifan Gouri (BOYS MSG) — POKEDEVS',
    description:
      'Chronological public development updates, features built, infrastructure engineering, and milestones.',
    type: 'website',
    url: 'https://shifan.pokefun.in/journal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Journal | Mohd Shifan Gouri (BOYS MSG)',
    description: 'Public development timeline, features built, and engineering milestones.',
  },
  alternates: {
    canonical: 'https://shifan.pokefun.in/journal',
  },
};

export const revalidate = 60; // ISR cache 60 seconds

export default async function JournalPage() {
  const initialData = await getPublicJournalEntries(1, 12);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-electric-blue selection:text-white">
      <Navbar activeSection="journal" />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
            <Link href="/" className="hover:text-electric-blue transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-electric-blue font-semibold">Developer Journal</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-ice border border-electric-blue/20 text-electric-blue text-xs font-semibold mb-3">
                <Terminal className="w-3.5 h-3.5" />
                <span>Continuous Engineering Log</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-midnight-900 tracking-tight">
                Developer Journal & Progress
              </h1>
              <p className="mt-2 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                A live, transparent record of what I&apos;m building, debugging, optimizing, and deploying across POKEDEVS and community infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-electric-blue/40 hover:text-electric-blue transition-all shadow-sm"
              >
                <Layers className="w-4 h-4" />
                <span>Explore Projects</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Client Interactive Filter & Timeline */}
        <JournalClientFilter
          initialEntries={initialData.entries}
          initialTotal={initialData.total}
          initialHasMore={initialData.hasMore}
        />
      </main>

      <Footer />
    </div>
  );
}
