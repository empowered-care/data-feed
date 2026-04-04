import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// Sample regions with mapped coordinates (approximated for 1024x1024 viewBox)
const REGIONS = [
  { id: 'addis', cx: 500, cy: 550, name: 'Addis Ababa', severity: 'high', cases: 124, lastUpdate: '10 mins ago', details: 'Multiple outbreaks centered around dense urban areas.' },
  { id: 'bahir', cx: 350, cy: 380, name: 'Bahir Dar', severity: 'medium', cases: 45, lastUpdate: '1 hour ago', details: 'Moderate risk detected in commercial districts.' },
  { id: 'dire', cx: 720, cy: 520, name: 'Dire Dawa', severity: 'medium', cases: 32, lastUpdate: '30 mins ago', details: 'Transport hubs show elevated anomalous patterns.' },
  { id: 'hawassa', cx: 500, cy: 750, name: 'Hawassa', severity: 'low', cases: 12, lastUpdate: '2 hours ago', details: 'Isolated symptoms reported near industrial zone.' },
  { id: 'mekelle', cx: 500, cy: 200, name: 'Mekelle', severity: 'high', cases: 89, lastUpdate: '5 mins ago', details: 'Severe risk cluster identified. Immediate attention required.' },
];

export default function EthiopiaMap() {
  const [hoveredRegion, setHoveredRegion] = useState<typeof REGIONS[0] | null>(null);

  return (
    <div className="relative w-full aspect-square md:aspect-[16/10] bg-background/5 overflow-hidden flex flex-col">
      {/* Legend & Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 z-20 pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-background/80 border border-border/50 backdrop-blur-md flex items-center gap-2 w-fit pointer-events-auto shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Live Feed</span>
        </div>
        
        {/* Legend Key */}
        <div className="px-4 py-3 rounded-2xl bg-background/80 border border-border/50 backdrop-blur-md flex flex-col gap-2 w-fit pointer-events-auto shadow-xl">
          <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1">Risk Intensity</p>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Moderate</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Stable</span>
          </div>
        </div>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
              <button onClick={() => zoomIn()} className="p-2 bg-background/90 backdrop-blur-md border border-border rounded-lg hover:bg-muted transition-colors shadow-lg">
                <ZoomIn className="w-4 h-4 text-foreground/80" />
              </button>
              <button onClick={() => zoomOut()} className="p-2 bg-background/90 backdrop-blur-md border border-border rounded-lg hover:bg-muted transition-colors shadow-lg">
                <ZoomOut className="w-4 h-4 text-foreground/80" />
              </button>
              <button onClick={() => resetTransform()} className="p-2 bg-background/90 backdrop-blur-md border border-border rounded-lg hover:bg-muted transition-colors shadow-lg">
                <Maximize className="w-4 h-4 text-foreground/80" />
              </button>
            </div>

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
              <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-background/5 via-background to-background">
                {/* Pan-able Grid Background */}
                <div className="absolute inset-0 bg-grid-white/5 bg-[size:32px_32px]" />
                
                <svg
                  viewBox="0 0 1024 1024"
                  className="w-full h-full drop-shadow-[0_0_25px_rgba(var(--primary),0.15)] filter"
                >
                  {/* Real Ethiopia SVG Path Map with distinct border styling */}
                  <g transform="translate(0, 1024) scale(0.1, -0.1)" fill="currentColor" stroke="currentColor">
                    <path
                      className="text-primary/10 stroke-primary/50 transition-all duration-1000"
                      strokeWidth="20"
                      d="M3141 9168 c-10 -24 -55 -134 -101 -244 -71 -172 -86 -200 -98 -188 -7 8 -21 14 -31 14 -11 0 -25 15 -36 41 -23 49 -64 73 -111 65 -38 -8 -84 -57 -84 -91 0 -33 -32 -41 -77 -20 -20 10 -64 20 -98 23 -90 7 -128 -16 -205 -123 l-61 -85 17 -28 c16 -29 15 -34 -86 -352 -110 -347 -108 -338 -84 -477 8 -43 -15 -52 -57 -22 -30 21 -35 21 -98 10 -157 -29 -161 -31 -167 -61 -3 -15 -48 -80 -100 -145 -96 -120 -102 -133 -135 -270 -11 -44 -24 -61 -102 -137 -82 -79 -89 -89 -82 -115 4 -15 9 -67 12 -114 l5 -86 -41 -32 c-51 -40 -53 -73 -12 -150 l28 -54 -34 -58 c-28 -48 -32 -65 -27 -96 9 -61 -16 -107 -66 -122 -23 -7 -43 -11 -44 -9 -74 104 -99 128 -131 128 -33 0 -36 -4 -116 -136 -72 -121 -80 -139 -70 -160 6 -13 8 -37 5 -52 -4 -19 1 -43 15 -70 27 -53 19 -93 -25 -127 -34 -26 -34 -27 -34 -105 0 -77 -1 -81 -48 -157 l-49 -78 12 -350 c7 -192 10 -353 8 -357 -2 -5 -14 -8 -27 -8 -18 0 -25 -10 -40 -55 -20 -58 -34 -68 -120 -85 -31 -6 -45 -4 -65 10 -14 10 -47 20 -72 24 -37 4 -52 1 -79 -18 -28 -19 -39 -21 -69 -13 -24 6 -50 6 -78 -2 l-41 -11 -7 -75 c-7 -74 -8 -76 -53 -116 -69 -60 -85 -92 -80 -161 6 -77 25 -98 92 -98 36 0 70 -9 114 -30 48 -23 68 -27 82 -20 28 15 36 13 73 -20 31 -27 36 -28 48 -14 17 21 65 11 99 -20 14 -13 37 -30 52 -37 41 -22 129 -144 148 -208 15 -50 21 -59 68 -86 28 -16 54 -39 58 -50 21 -74 50 -100 129 -119 44 -11 75 -44 75 -81 0 -44 25 -76 58 -73 31 2 71 -17 90 -44 7 -10 27 -25 44 -34 22 -11 29 -21 25 -35 -3 -11 5 -51 18 -88 12 -37 26 -88 30 -112 4 -25 22 -64 41 -90 27 -36 34 -56 34 -90 0 -30 14 -79 47 -156 46 -107 50 -113 95 -138 59 -32 61 -36 49 -81 -8 -28 -6 -43 6 -69 l16 -33 62 30 61 31 41 -26 c36 -23 45 -25 75 -15 31 9 40 7 75 -16 35 -23 41 -33 47 -73 5 -41 3 -50 -18 -72 -23 -25 -24 -29 -19 -146 5 -114 7 -122 35 -157 20 -26 27 -44 23 -58 -7 -23 28 -80 50 -80 8 0 21 -13 30 -29 17 -33 17 -33 385 -50 l185 -9 115 -55 c63 -31 144 -77 180 -104 36 -27 108 -78 160 -113 52 -34 170 -118 261 -186 l165 -124 109 -16 c82 -12 118 -13 149 -5 36 9 48 7 83 -10 29 -14 46 -17 64 -10 18 6 35 3 69 -14 38 -19 68 -23 200 -29 144 -7 157 -9 180 -31 18 -17 40 -24 80 -27 30 -3 63 -8 72 -12 14 -6 23 2 45 38 15 25 35 46 43 46 9 0 41 46 76 108 l61 107 238 123 c219 114 246 125 338 143 l99 19 22 -28 c52 -66 91 -103 149 -138 l62 -38 241 -4 241 -4 24 67 c27 78 57 105 117 105 21 0 144 9 273 20 210 18 237 22 269 44 24 16 39 36 48 65 21 72 103 141 308 263 159 94 199 113 289 139 l105 29 353 0 352 1 84 92 c107 117 1893 2208 1889 2211 -2 1 -138 -1 -303 -6 l-300 -8 -1065 326 -1066 327 -109 122 c-89 98 -123 128 -175 156 -58 30 -78 50 -183 179 -64 80 -138 174 -164 210 -25 36 -71 96 -101 134 -30 38 -69 101 -85 140 -16 39 -52 103 -78 143 -27 40 -49 77 -49 83 0 6 38 67 85 135 47 68 85 125 85 128 0 3 -25 9 -55 12 -42 6 -58 13 -70 31 -11 17 -25 24 -48 24 -17 0 -38 4 -46 9 -19 12 -70 -6 -102 -36 -24 -22 -36 -24 -138 -28 -75 -2 -120 -8 -134 -18 -37 -24 -87 -26 -151 -4 l-59 20 7 149 c4 93 3 163 -4 187 -8 30 -7 48 5 81 8 23 15 58 15 76 0 19 4 34 9 34 25 0 117 110 197 235 49 77 104 153 122 169 20 18 32 37 32 53 0 14 10 41 21 60 l22 35 -44 45 c-24 24 -61 54 -83 65 -21 11 -123 105 -226 208 -125 126 -215 207 -271 245 -111 75 -135 99 -169 165 -20 40 -38 60 -63 72 -23 11 -87 80 -194 210 l-159 193 -185 72 c-101 40 -194 71 -207 69 -19 -3 -28 6 -52 54 -27 53 -32 58 -54 52 -14 -4 -35 -23 -48 -42 -32 -47 -81 -53 -126 -15 -39 33 -142 75 -182 75 -28 0 -30 -2 -30 -40 0 -49 -20 -61 -62 -37 -22 13 -28 13 -28 3 0 -8 -11 -17 -25 -20 -14 -4 -31 -18 -37 -32 -6 -13 -16 -23 -22 -21 -12 4 -12 17 -2 57 4 17 0 36 -13 57 -28 45 -59 62 -103 56 -31 -4 -39 -10 -45 -34 -12 -42 -115 -119 -162 -119 -22 0 -58 -13 -95 -34 -52 -30 -62 -32 -92 -23 -20 6 -45 26 -61 46 -14 20 -39 50 -54 66 -15 17 -29 41 -31 55 -2 20 -9 26 -33 27 -56 5 -135 24 -135 33 0 13 -59 79 -82 91 -16 9 -21 4 -37 -33z"
                      fillRule="evenodd"
                    />
                  </g>

                  {/* Animated Map Points */}
                  {REGIONS.map((region, i) => {
                    const color =
                      region.severity === 'high' ? 'rgb(239 68 68)' :
                      region.severity === 'medium' ? 'rgb(234 179 8)' :
                      'rgb(34 197 94)';

                    const isHovered = hoveredRegion?.id === region.id;

                    return (
                      <g 
                        key={region.id} 
                        onMouseEnter={() => setHoveredRegion(region)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        className="cursor-pointer transition-transform"
                        style={{ transformOrigin: `${region.cx}px ${region.cy}px` }}
                      >
                        {/* Radar Pulse Effect */}
                        <motion.circle
                          cx={region.cx}
                          cy={region.cy}
                          r={isHovered ? 40 : 25}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: isHovered ? 1.5 : 2.5, opacity: isHovered ? 0.3 : 0 }}
                          transition={{ duration: isHovered ? 1.5 : 2.5, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
                        />
                        <circle cx={region.cx} cy={region.cy} r={isHovered ? 14 : 10} fill={color} className="drop-shadow-lg" />
                        
                        <text
                          x={region.cx + 25}
                          y={region.cy + 6}
                          className="text-lg fill-foreground font-bold tracking-wide"
                          style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,1))" }}
                        >
                          {region.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Relative Hover Popup Details */}
                <AnimatePresence>
                  {hoveredRegion && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute pointer-events-none drop-shadow-2xl z-30"
                      style={{
                        left: `${(hoveredRegion.cx / 1024) * 100}%`,
                        top: `${(hoveredRegion.cy / 1024) * 100}%`,
                        transform: 'translate(25px, -50%)',
                      }}
                    >
                      <div className="w-72 bg-background/95 backdrop-blur-xl border-2 border-border p-4 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 w-full h-1.5" 
                          style={{ 
                            backgroundColor: 
                              hoveredRegion.severity === 'high' ? '#ef4444' : 
                              hoveredRegion.severity === 'medium' ? '#eab308' : '#22c55e'
                          }} 
                        />
                        <div className="flex justify-between items-start mb-3 pt-1">
                          <h4 className="font-extrabold text-lg">{hoveredRegion.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full border border-border">
                            {hoveredRegion.lastUpdate}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground pb-0.5">Active Cases</p>
                            <p className="text-2xl font-black tabular-nums">{hoveredRegion.cases}</p>
                          </div>
                          <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground pb-0.5">Risk Level</p>
                            <p className="text-sm font-black uppercase" 
                               style={{ 
                                 color: hoveredRegion.severity === 'high' ? '#ef4444' : 
                                        hoveredRegion.severity === 'medium' ? '#eab308' : '#22c55e'
                               }}
                            >
                              {hoveredRegion.severity}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-background/50 p-2 rounded-md border border-border/30">
                          {hoveredRegion.details}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
