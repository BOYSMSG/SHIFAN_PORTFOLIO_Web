'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, MessageSquareText, BarChart3, LogOut, ShieldCheck, ExternalLink } from 'lucide-react';

export default function AdminNavHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, render minimal security header
  if (pathname === '/admin/login') {
    return (
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-electric-blue/30 shadow-2xs">
              <Image src="/assets/boysmsg.png" alt="Emblem" fill className="object-cover" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-midnight-900 tracking-tight">SHIFAN</span>
              <span className="ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-electric-ice text-electric-blue border border-electric-blue/20">
                Security Gateway
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-electric-blue flex items-center gap-1 transition-colors"
          >
            <span>Return to Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>
    );
  }

  const navLinks = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Feedback Inbox', href: '/admin/feedback', icon: MessageSquareText },
    { name: 'Visitor Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          
          {/* Left Brand Area */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-electric-blue/30 shadow-2xs group-hover:scale-105 transition-transform">
                <Image src="/assets/boysmsg.png" alt="Emblem" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-midnight-900 tracking-tight flex items-center gap-1.5">
                  <span>BOYS MSG</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-electric-ice text-electric-blue border border-electric-blue/20">
                    OWNER CONSOLE
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">shifan.pokefun.in</span>
              </div>
            </Link>

            {/* Separator */}
            <div className="hidden md:block h-6 w-px bg-slate-200 ml-2" />

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-electric-blue text-white shadow-sm shadow-electric-blue/25 font-bold'
                        : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Owner Authorized</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-electric-blue transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

        </div>

        {/* Mobile Subnav Row */}
        <div className="md:hidden flex items-center justify-between pb-3 pt-1 border-t border-slate-100 gap-1 overflow-x-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-electric-blue text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
}
