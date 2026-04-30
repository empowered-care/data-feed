import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, X, Activity, Shield, Droplets, Thermometer, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { RiskBadge } from './RiskBadge';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import regionPaths from './ethiopia-region-paths.json';

const CITY_TO_REGION: Record<string, string> = {
  'Addis Ababa': 'Addis Ababa',
  'Bole': 'Addis Ababa',
  'Mercato': 'Addis Ababa',
  'Bahir Dar': 'Amhara',
  'Gondar': 'Amhara',
  'Azezo': 'Amhara',
  'Dessie': 'Amhara',
  'Weldiya': 'Amhara',
  'Mekelle': 'Tigray',
  'Adigrat': 'Tigray',
  'Hawassa': 'SNNPR',
  'Arba Minch': 'SNNPR',
  'Hosaena': 'SNNPR',
  'Wolkite': 'SNNPR',
  'Jimma': 'Oromia',
  'Adama': 'Oromia',
  'Zway': 'Oromia',
  'Bale': 'Oromia',
  'Nekemte': 'Oromia',
  'Jijiga': 'Somali',
  'Gode': 'Somali',
  'Dire Dawa': 'Dire Dawa',
  'Harar': 'Harari People',
  'Semera': 'Afar',
  'Assosa': 'Benshangul-Gumaz',
  'Gambela': 'Gambela Peoples',
  'Moyale': 'Oromia',
};

const LOCATION_COORDS: Record<string, { cx: number; cy: number }> = {
  'Addis Ababa': { cx: 250, cy: 323 },
  'Bole': { cx: 258, cy: 328 }, // Spread slightly SE
  'Mercato': { cx: 242, cy: 318 }, // Spread slightly NW
  'Bahir Dar': { cx: 200, cy: 150 },
  'Gondar': { cx: 220, cy: 120 },
  'Azezo': { cx: 218, cy: 125 },
  'Dessie': { cx: 290, cy: 190 },
  'Weldiya': { cx: 295, cy: 170 },
  'Mekelle': { cx: 280, cy: 60 },
  'Adigrat': { cx: 290, cy: 40 },
  'Hawassa': { cx: 240, cy: 370 },
  'Arba Minch': { cx: 200, cy: 410 },
  'Hosaena': { cx: 220, cy: 360 },
  'Wolkite': { cx: 200, cy: 340 },
  'Jimma': { cx: 160, cy: 320 },
  'Adama': { cx: 280, cy: 340 },
  'Zway': { cx: 260, cy: 360 },
  'Bale': { cx: 340, cy: 420 },
  'Nekemte': { cx: 140, cy: 260 }, // Shifted West to de-cluster
  'Jijiga': { cx: 460, cy: 250 },
  'Gode': { cx: 550, cy: 380 },
  'Dire Dawa': { cx: 422, cy: 245 },
  'Harar': { cx: 426, cy: 260 },
  'Semera': { cx: 370, cy: 160 },
  'Assosa': { cx: 100, cy: 200 },
  'Gambela': { cx: 58, cy: 327 },
  'Moyale': { cx: 380, cy: 480 },
};

export default function EthiopiaMap() {
  const { reports } = useAppStore();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<any | null>(null);

  // Group reports by REGION
  const regionData = Object.entries(reports.reduce((acc: any, r) => {
    const rawLoc = r.extracted_data.location;
    const region = CITY_TO_REGION[rawLoc] || rawLoc; // Fallback to rawLoc if no mapping
    
    if (!acc[region]) {
      acc[region] = {
        region: region,
        reports: [],
        maxRisk: 'LOW',
        totalCases: 0,
      };
    }
    acc[region].reports.push(r);
    acc[region].totalCases += r.extracted_data.cases;
    
    const risk = r.risk_analysis?.risk_level || 'LOW';
    if (risk === 'HIGH') acc[region].maxRisk = 'HIGH';
    else if (risk === 'MEDIUM' && acc[region].maxRisk !== 'HIGH') acc[region].maxRisk = 'MEDIUM';
    
    return acc;
  }, {})).reduce((acc: any, [k, v]) => { acc[k] = v; return acc; }, {});

  // Group reports by exact location for 3D pins
  const cityPins = Object.entries(reports.reduce((acc: any, r) => {
    const loc = r.extracted_data.location;
    if (!acc[loc]) {
      acc[loc] = {
        location: loc,
        region: loc, // Use same key for slide-over details
        reports: [],
        maxRisk: 'LOW',
        totalCases: 0,
        cx: LOCATION_COORDS[loc]?.cx || 350 + Math.random() * 50,
        cy: LOCATION_COORDS[loc]?.cy || 300 + Math.random() * 50,
      };
    }
    acc[loc].reports.push(r);
    acc[loc].totalCases += r.extracted_data.cases;
    const risk = r.risk_analysis?.risk_level || 'LOW';
    if (risk === 'HIGH') acc[loc].maxRisk = 'HIGH';
    else if (risk === 'MEDIUM' && acc[loc].maxRisk !== 'HIGH') acc[loc].maxRisk = 'MEDIUM';
    return acc;
  }, {})).map(([_, v]) => v as any);

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
          <p className="text-[9px] uppercase tracking-[0.2em] font-black text-foreground mb-1">Risk Intensity</p>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-foreground">Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-foreground">Stable</span>
          </div>
        </div>
      </div>

      <TransformWrapper
        initialScale={1.2}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
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

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%", perspective: "1200px" }} contentStyle={{ width: "100%", height: "100%" }}>
              <div 
                className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-background/5 via-background to-background"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 bg-grid-white/5 bg-[size:32px_32px]" />
                
                {/* MAP CONTAINER - Clean top-down view with subtle depth */}
                <div 
                  className="w-full h-full flex items-center justify-center absolute inset-0 transition-transform duration-1000 ease-out"
                >
                  <svg
                    viewBox="0 0 800 600"
                    className="w-[110%] h-[110%] overflow-visible filter drop-shadow-[0_15px_25px_rgba(var(--primary),0.15)]"
                  >
                    <defs>
                      <linearGradient id="risk-high" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#991b1b" stopOpacity="0.95" />
                      </linearGradient>
                      <linearGradient id="risk-medium" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
                      </linearGradient>
                      <linearGradient id="risk-low" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
                      </linearGradient>
                      <linearGradient id="base-region" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="base-region-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <g transform="translate(100, 30)">
                      {Object.entries(regionPaths).map(([regionName, pathD]) => {
                        const data = regionData[regionName];
                        const isHovered = hoveredRegion === regionName;
                        
                        let baseColor = 'url(#base-region)';
                        let strokeColor = 'rgba(var(--primary), 0.2)';
                        
                        if (data) {
                          if (data.maxRisk === 'HIGH') {
                            baseColor = 'url(#risk-high)';
                            strokeColor = '#fca5a5';
                          } else if (data.maxRisk === 'MEDIUM') {
                            baseColor = 'url(#risk-medium)';
                            strokeColor = '#fcd34d';
                          } else {
                            baseColor = 'url(#risk-low)';
                            strokeColor = '#6ee7b7';
                          }
                        }

                        if (isHovered) {
                           baseColor = data?.maxRisk === 'HIGH' ? '#ef4444' : 
                                       data?.maxRisk === 'MEDIUM' ? '#f59e0b' :
                                       data ? '#10b981' : 
                                       'url(#base-region-hover)';
                           strokeColor = 'hsl(var(--primary))';
                        }

                        return (
                          <motion.g key={regionName}>
                            {/* Shadow/Extrusion Base */}
                            <motion.path
                              d={pathD as string}
                              fill="rgba(0,0,0,0.5)"
                              stroke="none"
                              initial={false}
                              animate={{ 
                                scale: isHovered ? 1.02 : 1, 
                                y: isHovered ? 5 : 2, 
                                opacity: isHovered ? 0.3 : 0.6 
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              style={{ transformOrigin: "center" }}
                            />
                            
                            {/* Main Region Plane */}
                            <motion.path
                              d={pathD as string}
                              fill={baseColor}
                              stroke={strokeColor}
                              strokeWidth={isHovered ? "2.5" : "1.5"}
                              className="cursor-pointer transition-colors duration-300"
                              initial={false}
                              animate={{ 
                                scale: isHovered ? 1.02 : 1,
                                y: isHovered ? -5 : 0,
                                filter: isHovered ? "drop-shadow(0px 10px 15px rgba(0,0,0,0.6))" : "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              style={{ transformOrigin: "center" }}
                              onMouseEnter={() => setHoveredRegion(regionName)}
                              onMouseLeave={() => setHoveredRegion(null)}
                              onClick={() => {
                                if (data) setSelectedRegion(data);
                              }}
                            />
                          </motion.g>
                        );
                      })}

                      {/* 3D PINS FOR CITIES */}
                      {cityPins.map((pin: any) => {
                        const isHovered = hoveredPin === pin.location;
                        const pinColor = pin.maxRisk === 'HIGH' ? 'rgb(239 68 68)' :
                                         pin.maxRisk === 'MEDIUM' ? 'rgb(234 179 8)' :
                                         'rgb(34 197 94)';
                        const shadowColor = pin.maxRisk === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' :
                                            pin.maxRisk === 'MEDIUM' ? 'rgba(234, 179, 8, 0.4)' :
                                            'rgba(34, 197, 94, 0.4)';
                        return (
                          <motion.g 
                            key={`pin-${pin.location}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPin(pin.location)}
                            onMouseLeave={() => setHoveredPin(null)}
                            onClick={() => setSelectedRegion(pin)}
                            initial={false}
                            animate={{ 
                              scale: isHovered ? 1.3 : 1,
                              y: isHovered ? -12 : 0 
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 12 }} // Bouncier!
                          >
                            {/* Drop Shadow mimicking height */}
                            <motion.ellipse 
                              cx={pin.cx} cy={pin.cy + 5} rx={10} ry={4} 
                              fill="rgba(0,0,0,0.5)" 
                              filter="blur(2px)" 
                              initial={false}
                              animate={{ 
                                scale: isHovered ? 0.6 : 1,
                                opacity: isHovered ? 0.3 : 0.6,
                                y: isHovered ? 12 : 0
                              }}
                              transition={{ type: "spring", stiffness: 400, damping: 12 }}
                            />

                            {/* Outer Radar Pulse */}
                            <motion.circle
                              cx={pin.cx} cy={pin.cy} r={isHovered ? 20 : 12}
                              fill="none" stroke={pinColor} strokeWidth="1.5"
                              initial={{ opacity: 0.8, scale: 0.5 }}
                              animate={{ opacity: 0, scale: 1.5 }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            
                            {/* Inner Node */}
                            <circle cx={pin.cx} cy={pin.cy} r={isHovered ? 6 : 4} fill={pinColor} className="drop-shadow-lg" />
                            
                            {/* Base Glow */}
                            <circle cx={pin.cx} cy={pin.cy} r={isHovered ? 12 : 8} fill={pinColor} opacity={0.3} filter="blur(3px)" />
                          </motion.g>
                        );
                      })}
                    </g>
                  </svg>
                  
                  {/* Floating Tooltip HUD positioned near the top of the container */}
                  <AnimatePresence>
                    {(() => {
                       if (!hoveredRegion && !hoveredPin) return null;

                       const activeData = hoveredPin 
                         ? cityPins.find((p:any) => p.location === hoveredPin)
                         : regionData[hoveredRegion as string];
                       
                       const isHighRisk = activeData?.maxRisk === 'HIGH';
                       const isMediumRisk = activeData?.maxRisk === 'MEDIUM';
                       
                       const glowColor = isHighRisk ? 'rgba(239,68,68,0.4)' : 
                                         isMediumRisk ? 'rgba(250,204,21,0.4)' : 
                                         activeData ? 'rgba(16,185,129,0.3)' : 'rgba(var(--primary),0.15)';
                       
                       const borderColor = isHighRisk ? 'border-red-500/50' : 
                                           isMediumRisk ? 'border-amber-500/50' : 
                                           activeData ? 'border-emerald-500/50' : 'border-border/50';

                       return (
                         <motion.div
                           initial={{ opacity: 0, y: -15, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: -15, scale: 0.95 }}
                           transition={{ type: "spring", stiffness: 400, damping: 25 }}
                           className="absolute top-8 pointer-events-none z-50 flex justify-center w-full"
                         >
                           <div className={cn(
                             "flex items-center gap-5 px-6 py-3.5 rounded-2xl bg-background/85 backdrop-blur-xl border shadow-2xl transition-colors duration-300",
                             borderColor
                           )} style={{ boxShadow: `0 10px 40px -10px ${glowColor}` }}>
                             
                             <div className="flex flex-col gap-1 text-left">
                               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                 <span className={cn(
                                   "w-2 h-2 rounded-full shadow-sm",
                                   isHighRisk ? "bg-red-500 animate-pulse shadow-red-500/50" : 
                                   isMediumRisk ? "bg-amber-500 animate-pulse shadow-amber-500/50" : 
                                   activeData ? "bg-emerald-500 shadow-emerald-500/50" : "bg-muted"
                                 )} />
                                 {hoveredPin ? 'Target Location' : 'Regional Sector'}
                               </p>
                               <h4 className="text-lg font-black text-foreground tracking-tight leading-none">{hoveredPin || hoveredRegion}</h4>
                             </div>

                             <div className="w-px h-10 bg-border/50 mx-1" />
                             
                             {activeData ? (
                               <div className="flex flex-col items-end justify-center">
                                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Active Cases</p>
                                 <p className={cn(
                                   "text-xl font-black leading-none tabular-nums tracking-tighter",
                                   isHighRisk ? "text-red-500" : isMediumRisk ? "text-amber-500" : "text-emerald-500"
                                 )}>
                                   {activeData.totalCases}
                                 </p>
                               </div>
                             ) : (
                               <div className="flex items-center justify-center h-10 px-2">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No active signals</p>
                               </div>
                             )}
                           </div>
                         </motion.div>
                       );
                    })()}
                  </AnimatePresence>

                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Slide-over detail panel when a region is clicked */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[450px] bg-background/95 backdrop-blur-xl border-l border-border/50 z-30 shadow-2xl overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Activity className="h-5 w-5 text-primary" />
                   <h3 className="text-xl font-black tracking-tighter uppercase">{selectedRegion.region} Region</h3>
                </div>
                <button 
                  onClick={() => setSelectedRegion(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Intelligence</p>
                    <p className="text-2xl font-black tabular-nums">{selectedRegion.reports.length}</p>
                 </div>
                 <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Impact Radius</p>
                    <p className="text-2xl font-black tabular-nums">{selectedRegion.totalCases}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-2">Active Signals</p>
                {selectedRegion.reports.map((r: any, idx: number) => (
                  <div key={r.session_id} className="p-5 rounded-2xl bg-background border border-border/50 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                       <RiskBadge level={r.risk_analysis?.risk_level} />
                       <span className="text-[9px] font-mono font-bold text-muted-foreground">
                         {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today'}
                       </span>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{r.risk_analysis?.possible_disease}</p>
                      <h4 className="text-sm font-bold leading-tight">{r.alert?.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1"><span className="font-bold">City/Area:</span> {r.extracted_data.location}</p>
                    </div>

                    {r.context_research && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-muted/20 rounded-lg flex flex-col items-center">
                          <Shield className={cn("h-3.5 w-3.5 mb-1", r.context_research.conflict_zone ? "text-risk-high" : "text-health")} />
                          <span className="text-[8px] font-black uppercase">{r.context_research.conflict_zone ? 'Conflict' : 'Stable'}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg flex flex-col items-center">
                          <Droplets className="h-3.5 w-3.5 mb-1 text-primary" />
                          <span className="text-[8px] font-black uppercase">{r.context_research.water_quality || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg flex flex-col items-center">
                          <Thermometer className="h-3.5 w-3.5 mb-1 text-orange-500" />
                          <span className="text-[8px] font-black uppercase">{r.context_research.temperature || 'N/A'}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                       <details className="group">
                          <summary className="text-[10px] font-black text-muted-foreground uppercase cursor-pointer hover:text-primary transition-colors flex items-center gap-2 list-none">
                            <FileText className="h-3 w-3" /> View Analytical Matrix
                          </summary>
                          <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground mt-2 p-3 bg-muted/30 rounded-xl">
                            {r.risk_analysis?.reason}
                          </p>
                       </details>
                       
                       <details className="group">
                          <summary className="text-[10px] font-black text-muted-foreground uppercase cursor-pointer hover:text-primary transition-colors flex items-center gap-2 list-none">
                            <FileText className="h-3 w-3" /> View Raw Transmission
                          </summary>
                          <p className="text-[11px] font-mono leading-relaxed text-muted-foreground mt-2 p-3 bg-black/90 text-green-400 rounded-xl overflow-x-auto whitespace-pre-wrap">
                            {r.raw_report || 'Binary archive - text data only.'}
                          </p>
                       </details>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]" variant="outline" onClick={() => setSelectedRegion(null)}>
                  Close Surveillance Feed
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
