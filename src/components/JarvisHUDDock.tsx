'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Shield, Radio, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { playHoverSound, playSwitchSound, toggleSound, isSoundEnabled } from '@/utils/soundEffects';

interface HUDProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const SECTIONS = [
  { id: 'hero', code: '01', label: 'CORE // HERO' },
  { id: 'about', code: '02', label: 'BIO // ETHOS' },
  { id: 'journey', code: '03', label: 'BCA // TIMELINE' },
  { id: 'projects', code: '04', label: 'SYS // PROJECTS' },
  { id: 'ventures', code: '05', label: 'OPS // VENTURES' },
  { id: 'skills', code: '06', label: 'STK // SKILLS' },
  { id: 'services', code: '07', label: 'SVC // COMING SOON' },
  { id: 'community', code: '08', label: 'NET // COMMUNITY' },
  { id: 'contact', code: '09', label: 'COM // CONTACT' },
];

export default function JarvisHUDDock({ activeSection, onNavigate }: HUDProps) {
  const [soundOn, setSoundOn] = useState(true);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    setSoundOn(isSoundEnabled());

    // Simple FPS tracker simulation for sci-fi telemetry
    let frameCount = 0;
    let lastTime = performance.now();
    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(120, Math.round((frameCount * 1000) / (now - lastTime))));
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    const req = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(req);
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playSwitchSound();
  };

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);

  const goNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      playSwitchSound();
      onNavigate(SECTIONS[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      playSwitchSound();
      onNavigate(SECTIONS[currentIndex - 1].id);
    }
  };

  return (
    <>
      {/* Right Edge Holographic HUD Telemetry Dock (Desktop) */}
      <aside
        aria-label="JARVIS Telemetry HUD"
        className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-3 select-none pointer-events-auto"
      >
        {/* HUD Header Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-900/80 backdrop-blur-md border border-electric-cyan/30 text-white shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-cyan"></span>
          </span>
          <span className="text-[10px] font-mono tracking-widest text-electric-cyan">
            SYS.ONLINE // {fps} FPS
          </span>
          
          <button
            onClick={handleSoundToggle}
            onMouseEnter={playHoverSound}
            className="p-1 text-slate-300 hover:text-electric-cyan transition-colors ml-1 focus:outline-none"
            title={soundOn ? 'Mute Sci-Fi Feedback' : 'Enable Sci-Fi Audio'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-electric-cyan" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>

        {/* Section Telemetry Track */}
        <div className="flex flex-col items-end gap-1.5 p-2 rounded-2xl bg-white/75 backdrop-blur-xl border border-electric-blue/15 shadow-glass">
          {SECTIONS.map((sec, idx) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  playSwitchSound();
                  onNavigate(sec.id);
                }}
                onMouseEnter={playHoverSound}
                className={`group flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all duration-300 ${
                  isActive
                    ? 'bg-midnight-900 text-electric-cyan shadow-sm border border-electric-cyan/40 scale-105'
                    : 'text-slate-500 hover:text-midnight-900 hover:bg-electric-ice/60'
                }`}
              >
                <span className={`text-[9px] ${isActive ? 'text-electric-blue font-bold' : 'text-slate-400'}`}>
                  {sec.code}
                </span>
                <span className="font-semibold tracking-tight">
                  {sec.label}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isActive ? 'bg-electric-cyan shadow-cyan-glow scale-125' : 'bg-slate-300 group-hover:bg-electric-blue'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Quick Prev/Next HUD Controls */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-slate-200">
          <button
            onClick={goPrev}
            disabled={currentIndex <= 0}
            className="p-1 rounded-lg text-slate-600 hover:text-electric-blue hover:bg-electric-ice disabled:opacity-30 transition-colors"
            title="Previous Stage"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono font-bold text-midnight-800 px-1">
            {currentIndex + 1}/9
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex >= SECTIONS.length - 1}
            className="p-1 rounded-lg text-slate-600 hover:text-electric-blue hover:bg-electric-ice disabled:opacity-30 transition-colors"
            title="Next Stage"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Floating Bottom Hologram Bar (Mobile & Tablet) */}
      <div className="xl:hidden fixed bottom-4 inset-x-4 z-40 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-midnight-900/90 backdrop-blur-xl border border-electric-cyan/30 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-electric-cyan animate-ping" />
          <span className="text-[11px] font-mono font-bold text-electric-cyan">
            {SECTIONS[currentIndex]?.label || 'CORE // HERO'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={currentIndex <= 0}
            className="p-1.5 rounded-lg bg-midnight-800 text-slate-300 disabled:opacity-30 active:scale-95"
            aria-label="Previous Section"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400">{currentIndex + 1}/9</span>
          <button
            onClick={goNext}
            disabled={currentIndex >= SECTIONS.length - 1}
            className="p-1.5 rounded-lg bg-midnight-800 text-slate-300 disabled:opacity-30 active:scale-95"
            aria-label="Next Section"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
