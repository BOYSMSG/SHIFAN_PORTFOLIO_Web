'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setWebglSupported(false);
        return;
      }
    }

    const container = mountRef.current;
    if (!container) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 700;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Concentric Ripple Rings (Jitter Ripple Effect inspired)
    const ringCount = 5;
    const rings: THREE.Mesh[] = [];

    for (let i = 0; i < ringCount; i++) {
      const radius = 3.5 + i * 2.2;
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.05, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x1677FF : 0x00C9D8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.18 - i * 0.025,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.8;
      mainGroup.add(ring);
      rings.push(ring);
    }

    // 2. Center Floating Refined Glass Geometry (Minimalist icosahedron wireframe)
    const icoGeo = new THREE.IcosahedronGeometry(4.2, 1);
    const icoWire = new THREE.WireframeGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0x1677FF,
      transparent: true,
      opacity: 0.28,
    });
    const icoMesh = new THREE.LineSegments(icoWire, icoMat);
    mainGroup.add(icoMesh);

    // 3. Gentle Floating Light Orbs (Soft bokeh)
    const orbCount = 35;
    const orbGeo = new THREE.BufferGeometry();
    const orbPositions = new Float32Array(orbCount * 3);

    for (let i = 0; i < orbCount; i++) {
      orbPositions[i * 3] = (Math.random() - 0.5) * 28;
      orbPositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      orbPositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }

    orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPositions, 3));
    const orbMat = new THREE.PointsMaterial({
      color: 0x00C9D8,
      size: 0.2,
      transparent: true,
      opacity: 0.45,
    });
    const orbs = new THREE.Points(orbGeo, orbMat);
    mainGroup.add(orbs);

    // Mouse movement easing
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      targetX = (event.clientX - windowHalfX) * 0.0004;
      targetY = (event.clientY - windowHalfY) * 0.0004;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      mainGroup.rotation.y = mouseX * 0.6 + elapsedTime * 0.05;
      mainGroup.rotation.x = mouseY * 0.6;

      // Ripple wave pulse on rings (breathing wave effect)
      rings.forEach((ring, idx) => {
        const wave = Math.sin(elapsedTime * 1.5 - idx * 0.5);
        const scaleVal = 1 + wave * 0.035;
        ring.scale.set(scaleVal, scaleVal, scaleVal);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.16 + wave * 0.05;
      });

      icoMesh.rotation.y += 0.002;
      icoMesh.rotation.x += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rings.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      icoGeo.dispose();
      icoWire.dispose();
      icoMat.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-80"
      aria-hidden="true"
    >
      {!webglSupported && (
        <div className="absolute inset-0 bg-gradient-to-tr from-electric-ice/30 to-transparent flex items-center justify-center">
          <div className="w-80 h-80 rounded-full border border-electric-cyan/20 blur-xl bg-electric-cyan/10" />
        </div>
      )}
    </div>
  );
}
