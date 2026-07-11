const fs = require('fs');
const file = './src/components/axon/Experience.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Theme System after gsap.registerPlugin
const themeSystem = `
// ==========================================
// COLOR PALETTE SYSTEM
// ==========================================
type Palette = { name: string; primary: string; secondary: string; bg: string; dnaA: string; dnaB: string; };
const PALETTES: Palette[] = [
  { name: "Classic Axon", primary: "#00e5ff", secondary: "#b026ff", bg: "#000000", dnaA: "#00e5ff", dnaB: "#ff2a00" },
  { name: "Neon Genesis", primary: "#D4FF00", secondary: "#5A00FF", bg: "#000000", dnaA: "#D4FF00", dnaB: "#5A00FF" },
  { name: "Quantum Monolith", primary: "#FFFFFF", secondary: "#A1A1AA", bg: "#050505", dnaA: "#FFFFFF", dnaB: "#A1A1AA" },
  { name: "Bioluminescent", primary: "#00FFAA", secondary: "#0044FF", bg: "#010B13", dnaA: "#00FFAA", dnaB: "#0044FF" },
  { name: "Thermal Optic", primary: "#FF3300", secondary: "#FFCC00", bg: "#0A0A0A", dnaA: "#FF3300", dnaB: "#FFCC00" },
  { name: "Holographic Glass", primary: "#FF00A0", secondary: "#7B2CBF", bg: "#0C0A10", dnaA: "#FF00A0", dnaB: "#00E5FF" },
  { name: "Cyberpunk 2077", primary: "#F2E900", secondary: "#02D7F2", bg: "#050505", dnaA: "#F2E900", dnaB: "#02D7F2" },
  { name: "Digital Terminal", primary: "#39FF14", secondary: "#FF10F0", bg: "#0D0D0D", dnaA: "#39FF14", dnaB: "#FF10F0" },
  { name: "Lunar Chrome", primary: "#7DF9FF", secondary: "#EAEAEA", bg: "#1E1E1E", dnaA: "#7DF9FF", dnaB: "#EAEAEA" },
  { name: "Hologram Haze", primary: "#BF00FF", secondary: "#00CCFF", bg: "#100B1A", dnaA: "#BF00FF", dnaB: "#00CCFF" }
];

let currentThemeIndex = 0;
const themeListeners = new Set<() => void>();

export const getTheme = () => PALETTES[currentThemeIndex];
export const setTheme = (idx: number) => {
  currentThemeIndex = idx;
  const t = PALETTES[idx];
  document.documentElement.style.setProperty('--theme-primary', t.primary);
  document.documentElement.style.setProperty('--theme-secondary', t.secondary);
  document.documentElement.style.setProperty('--theme-bg', t.bg);
  themeListeners.forEach(l => l());
};

export const useTheme = () => {
  const [theme, set] = React.useState(getTheme());
  React.useEffect(() => {
    const l = () => set(getTheme());
    themeListeners.add(l);
    setTheme(currentThemeIndex); // init
    return () => themeListeners.delete(l);
  }, []);
  return theme;
};

function ThemeDashboard() {
  const theme = useTheme();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 bg-black/80 backdrop-blur border border-white/10 p-4 rounded-xl text-white font-mono text-[10px]">
      <div className="text-white/50 mb-2 tracking-widest uppercase">Select Palette</div>
      <div className="grid grid-cols-2 gap-2">
        {PALETTES.map((p, i) => (
          <button 
            key={p.name} 
            onClick={(e) => { e.stopPropagation(); setTheme(i); }}
            className={\`px-3 py-2 text-left rounded border transition-all \${theme.name === p.name ? 'border-[var(--theme-primary)] bg-white/5 text-white' : 'border-white/5 text-white/40 hover:border-white/20 hover:text-white'}\`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.primary }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.secondary }} />
            </div>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
`;

code = code.replace('gsap.registerPlugin(ScrollTrigger);', 'gsap.registerPlugin(ScrollTrigger);\nimport React from "react";\n' + themeSystem);

// 2. Update ActiveTheoryCore
code = code.replace(
  'function ActiveTheoryCore({ visible, fluidRadius, particleCount, scatterAmount, globalTimeScale }: any) {',
  'function ActiveTheoryCore({ visible, fluidRadius, particleCount, scatterAmount, globalTimeScale }: any) {\n  const theme = useTheme();'
);
code = code.replace(
  'materialRef.current.uTime = state.clock.elapsedTime;',
  'materialRef.current.uTime = state.clock.elapsedTime;\n      materialRef.current.uColor1.set(theme.primary);\n      materialRef.current.uColor2.set(theme.secondary);'
);

// 3. Update DNAStrand
code = code.replace(
  'function DNAStrand({ visible, dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount }: {',
  'function DNAStrand({ visible, dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount }: {\n  visible: boolean;\n  dnaRadius: number;\n  dnaHeight: number;\n  dnaLoops: number;\n  particleCount: number;\n  scatterAmount: number;\n}) {\n  const theme = useTheme();\n  const groupRef = React.useRef<THREE.Group>(null); // skip'
);
code = code.replace(
  'const cRed  = new THREE.Color("#ff2a00").multiplyScalar(1.5);',
  'const cRed  = new THREE.Color(theme.dnaB).multiplyScalar(1.5);'
);
code = code.replace(
  'const cCyan = new THREE.Color("#00e5ff").multiplyScalar(1.5);',
  'const cCyan = new THREE.Color(theme.dnaA).multiplyScalar(1.5);'
);
code = code.replace(
  '}, [dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount]);',
  '}, [dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount, theme]);'
);

// 4. Update CanvasLabel
code = code.replace(
  'function CanvasLabel({ text }: { text: string }) {',
  'function CanvasLabel({ text }: { text: string }) {\n  const theme = useTheme();'
);
code = code.replace(
  "ctx.strokeStyle = 'rgba(0,229,255,0.5)';",
  "ctx.strokeStyle = theme.primary;"
);
code = code.replace(
  "ctx.fillStyle = '#00e5ff';",
  "ctx.fillStyle = theme.primary;"
);
code = code.replace(
  "}, [text]);",
  "}, [text, theme]);"
);

// 5. Update OrbitingCardItem themeColor
code = code.replace(
  'const themeColor = isLeft ? "#00e5ff" : "#ff2a00";',
  'const theme = useTheme();\n  const themeColor = isLeft ? theme.primary : theme.dnaB;'
);

// 6. Experience Return
code = code.replace(
  '{/* Fixed Contact Overlay */}',
  '<ThemeDashboard />\n\n        {/* Fixed Contact Overlay */}'
);

// 7. Tailwind Replacements for #00e5ff
// Replace text-[#00e5ff], bg-[#00e5ff], border-[#00e5ff], etc with var(--theme-primary)
code = code.replace(/\[#00e5ff\]/g, '[var(--theme-primary)]');
code = code.replace(/_#00e5ff/g, '_var(--theme-primary)');
code = code.replace(/text-\[\#00e5ff\]/g, 'text-[var(--theme-primary)]');

// Replace secondary colors
code = code.replace(/\[#ff2a00\]/g, '[var(--theme-secondary)]');
code = code.replace(/_#ff2a00/g, '_var(--theme-secondary)');
code = code.replace(/\[#b026ff\]/g, '[var(--theme-secondary)]');

// 8. Fix global CSS
code = code.replace(
  '::selection { background-color: var(--theme-primary); color: var(--theme-bg); }',
  '::selection { background-color: var(--theme-primary); color: var(--theme-bg); }'
); // Ensure it's there? Wait, it wasn't there before.
code = code.replace(
  'selection:bg-[#00e5ff]',
  'selection:bg-[var(--theme-primary)]'
);

// We should fix the CSS Variables
code = code.replace(
  'html, body { background-color: #000000;',
  'html, body { background-color: var(--theme-bg, #000000);'
);
code = code.replace(
  'bg-black text-[#e2e2e5]',
  'bg-[var(--theme-bg)] text-[#e2e2e5]'
);

fs.writeFileSync(file, code);
console.log("Done patching Experience.tsx");
