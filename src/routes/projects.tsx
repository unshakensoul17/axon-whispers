import { createFileRoute, Link } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BackgroundConstellation } from "@/components/axon/Experience";
import { ExternalLink, Github, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

import contentData from '@/data/content.json';

const ALL_PROJECTS = contentData.allProjects;

function ProjectsPage() {
  return (
    <div className="relative min-h-screen bg-[#07050F] text-[#e2e2e5] font-sans selection:bg-[#9B5DE5] selection:text-black overflow-x-hidden pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400..800&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
      `}</style>

      {/* 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.5} />
          <BackgroundConstellation />
          <EffectComposer>
            <Bloom intensity={1.4} luminanceThreshold={0.2} luminanceSmoothing={0.5} mipmapBlur={true} height={350} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Static CSS Grain & Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[4]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.035 }} />
      <div className="fixed inset-0 pointer-events-none z-[5]" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)' }}></div>

      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-white/50 hover:text-[#9B5DE5] transition-colors flex items-center gap-2 font-mono text-sm uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Core
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl md:text-3xl tracking-wider text-white font-display">
            <span className="font-bold">ORBITAL</span> <span className="font-light">ARCHIVES</span>
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.1em] text-[#F8FAFC] mb-4">
            All <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9B5DE5] to-[#F15BB5]">Projects</span>
          </h1>
          <p className="text-[#E2E8F0] opacity-70 max-w-2xl text-lg">
            A complete log of architectures, agents, and systems deployed into the autonomous frontier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ALL_PROJECTS.map((proj, idx) => (
            <div key={idx} className="bg-[#07050F]/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[#9B5DE5]/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(155,93,229,0.15)] group relative overflow-hidden">
              {/* Circuit Pattern overlay on hover */}
              <div className="absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-10" 
                   style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M10 10l10 10v20l-10 10m80-40l-10 10v20l10 10M30 30h40M50 10v80M20 70h20M70 70h20M30 50h10M60 50h10' stroke='rgba(155,93,229,0.8)' fill='none' stroke-width='0.5'/%3E%3Ccircle cx='20' cy='40' r='1.5' fill='rgba(155,93,229,0.8)'/%3E%3Ccircle cx='80' cy='60' r='1.5' fill='rgba(155,93,229,0.8)'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px' }}>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-wide mb-1 uppercase font-display">{proj.title}</h3>
                <p className="text-[#9B5DE5] text-xs font-mono tracking-widest uppercase mb-4">{proj.subtitle}</p>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  {proj.desc}
                </p>

                <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                  {proj.tech.map((t, i) => (
                    <span key={i} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono text-white/80 uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-white/10 relative z-10">
                {proj.github && (
                  <a href={proj.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors">
                    <Github size={16} /> Code
                  </a>
                )}
                {proj.live && (
                  <a href={proj.live} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00BBF9] hover:text-white transition-colors ml-auto">
                    <ExternalLink size={16} /> Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
