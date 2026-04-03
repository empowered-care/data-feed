import React from 'react';
import { motion } from 'framer-motion';

// Example regions to show glowing dots on
const REGIONS = [
  { id: 'addis', cx: 370, cy: 320, name: 'Addis Ababa', severity: 'high' },
  { id: 'bahir', cx: 280, cy: 210, name: 'Bahir Dar', severity: 'medium' },
  { id: 'dire', cx: 480, cy: 300, name: 'Dire Dawa', severity: 'low' },
  { id: 'hawassa', cx: 360, cy: 400, name: 'Hawassa', severity: 'medium' },
  { id: 'mekelle', cx: 350, cy: 110, name: 'Mekelle', severity: 'low' },
];

export default function EthiopiaMap() {
  return (
    <div className="relative w-full aspect-video md:aspect-[16/10] bg-background/40 rounded-xl overflow-hidden glass-card flex items-center justify-center p-4 border border-border">
      <div className="absolute inset-0 bg-grid-white/5 bg-[size:16px_16px]" style={{ maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)' }} />
      
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(var(--primary),0.3)] filter"
      >
        {/* Simplified outline of Ethiopia for the backdrop */}
        <path
          className="fill-primary/5 stroke-primary/30 stroke-2 transition-all duration-1000"
          d="M 120 300 
             C 100 250, 150 150, 250 120 
             C 320 100, 340 50, 400 40 
             C 450 30, 500 80, 530 150 
             C 580 180, 680 200, 720 250 
             C 740 300, 700 350, 650 380 
             C 620 400, 580 430, 550 480 
             C 500 550, 420 580, 380 560 
             C 340 540, 320 500, 280 480 
             C 250 460, 200 450, 150 400 
             C 100 350, 120 300, 120 300 Z"
          fillRule="evenodd"
        />
        
        {/* Decorative Grid Lines */}
        <line x1="0" y1="300" x2="800" y2="300" className="stroke-primary/10 stroke-1" strokeDasharray="4 4" />
        <line x1="400" y1="0" x2="400" y2="600" className="stroke-primary/10 stroke-1" strokeDasharray="4 4" />

        {/* Animated Dots for Regions */}
        {REGIONS.map((region, i) => {
          const color =
            region.severity === 'high' ? 'rgb(239 68 68)' : // red-500
            region.severity === 'medium' ? 'rgb(234 179 8)' : // yellow-500
            'rgb(34 197 94)'; // green-500

          return (
            <g key={region.id}>
              {/* Outer Pulse */}
              <motion.circle
                cx={region.cx}
                cy={region.cy}
                r={15}
                fill="none"
                stroke={color}
                strokeWidth="2"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
              />
              {/* Inner Dot */}
              <circle cx={region.cx} cy={region.cy} r={5} fill={color} />
              {/* Label */}
              <text
                x={region.cx + 15}
                y={region.cy + 4}
                className="text-xs fill-muted-foreground font-semibold tracking-wider font-mono"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(0,0,0,0.8))" }}
              >
                {region.name}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Overlay Status */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="px-3 py-1.5 rounded-md bg-background/80 border border-border backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">Live Map Active</span>
        </div>
      </div>
    </div>
  );
}
