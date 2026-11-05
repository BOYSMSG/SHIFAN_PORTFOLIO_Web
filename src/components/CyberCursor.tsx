'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CyberCursor() {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 220 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {/* Smooth glowing electric aura */}
      <motion.div
        className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-electric-cyan/20 blur-2xl pointer-events-none"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      />

      {/* Cybernetic HUD Target Crosshair */}
      <motion.div
        className="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full border border-electric-cyan/40 pointer-events-none flex items-center justify-center"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-electric-cyan shadow-cyan-glow" />
      </motion.div>

      {/* Subtle Coordinate Readout HUD */}
      <motion.div
        className="hidden xl:flex absolute top-4 left-6 text-[9px] font-mono tracking-wider text-slate-400 bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      >
        <span className="text-electric-blue">LOC:</span> {coords.x},{coords.y}
      </motion.div>
    </div>
  );
}
