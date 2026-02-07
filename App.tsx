
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Activity, Repeat, LayoutGrid, User, Share2, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FPMTData, MusclePathData, MOTData } from './types';
import { parseFPMTCSV } from './services/csvParser';
import { parseMOT } from './services/motParser';
import HeatmapCanvas from './components/HeatmapCanvas';
import MarkerVisualizer3D from './components/MarkerVisualizer3D';
import MuscleDetails from './components/MuscleDetails';
import BodyVisualizer from './components/BodyVisualizer';

const App: React.FC = () => {
  const [fpmtData, setFpmtData] = useState<FPMTData | null>(null);
  const [motData, setMotData] = useState<MOTData | null>(null);
  const [musclePathData, setMusclePathData] = useState<MusclePathData | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [heatmapMode, setHeatmapMode] = useState<'force' | 'range' | 'normalized'>('force');
  const [muscleCaps, setMuscleCaps] = useState<Record<string, number>>({});
  
  const playbackRef = useRef<number | null>(null);

  const handleFPMTUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseFPMTCSV(event.target?.result as string);
        setFpmtData(parsed);
        setCurrentFrame(0);
      } catch (err) {
        alert("Failed to parse FPMT CSV: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleMOTUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseMOT(event.target?.result as string);
        setMotData(parsed);
      } catch (err) {
        alert("Failed to parse MOT: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handlePathUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setMusclePathData(parsed);
      } catch (err) {
        alert("Failed to parse Muscle Path JSON: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleStep = (dir: number) => {
    if (!fpmtData) return;
    setCurrentFrame(prev => {
      const next = prev + dir;
      if (next < 0) return fpmtData.frames.length - 1;
      if (next >= fpmtData.frames.length) return 0;
      return next;
    });
  };

  const handleChartClick = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      setCurrentFrame(e.activeTooltipIndex);
    }
  };

  useEffect(() => {
    if (isPlaying && fpmtData) {
      playbackRef.current = window.setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= fpmtData.frames.length - 1) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / (30 * playbackSpeed));
    } else {
      if (playbackRef.current) clearInterval(playbackRef.current);
    }
    return () => { if (playbackRef.current) clearInterval(playbackRef.current); };
  }, [isPlaying, fpmtData, playbackSpeed, isLooping]);

  if (!fpmtData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.1),transparent)]" />
        <div className="max-w-4xl w-full text-center space-y-12 z-10">
          <div className="flex justify-center gap-8">
            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 transform -rotate-6">
                <Activity size={48} className="text-white" />
            </div>
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-900/40 transform rotate-6">
                <User size={48} className="text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter uppercase text-slate-100">FPMT <span className="text-blue-500">DECK</span></h1>
            <p className="text-xl text-slate-400 font-medium font-mono tracking-tight">Kinetic Anatomy Visualization & Feasibility Analytics.</p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Stream</h3>
               <label className="block cursor-pointer group">
                <input type="file" onChange={handleFPMTUpload} className="hidden" accept=".csv" />
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 bg-slate-900/50 hover:bg-slate-900 hover:border-blue-500 transition-all shadow-xl group-hover:scale-[1.02]">
                  <Upload className="mx-auto mb-4 text-slate-600 group-hover:text-blue-500" size={32} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">FPMT CSV</span>
                </div>
               </label>
            </div>

            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kinematic Model</h3>
               <label className="block cursor-pointer group">
                <input type="file" onChange={handleMOTUpload} className="hidden" accept=".mot,.sto" />
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500 transition-all shadow-xl group-hover:scale-[1.02]">
                  <FileText className="mx-auto mb-4 text-slate-600 group-hover:text-indigo-500" size={32} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">MOT (Optional)</span>
                </div>
               </label>
            </div>

            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Muscle Geometry</h3>
               <label className="block cursor-pointer group">
                <input type="file" onChange={handlePathUpload} className="hidden" accept=".json" />
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 bg-slate-900/50 hover:bg-slate-900 hover:border-emerald-500 transition-all shadow-xl group-hover:scale-[1.02]">
                  <Share2 className="mx-auto mb-4 text-slate-600 group-hover:text-emerald-500" size={32} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Path JSON</span>
                </div>
               </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Anatomy Diagnostic Deck</h2>
            <p className="text-[9px] text-slate-500 font-mono flex items-center gap-2 uppercase tracking-tighter">
               <span className="text-blue-500 animate-pulse">● ACTIVE</span> T: {fpmtData.frames[currentFrame].time.toFixed(3)}s | FRAME {currentFrame}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950/80 rounded-lg p-1 border border-white/5">
            {['force', 'normalized', 'range'].map(m => (
              <button 
                key={m}
                onClick={() => setHeatmapMode(m as any)}
                className={`px-4 py-1.5 text-[9px] font-black rounded-md uppercase tracking-widest transition-all ${heatmapMode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
          
          <button onClick={() => window.location.reload()} className="ml-4 p-2 text-slate-500 hover:text-white transition-colors">
            <Upload size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 bg-slate-950">
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
           <div className="flex-1 min-h-0">
             <MarkerVisualizer3D 
              fpmtData={fpmtData} 
              motData={motData}
              musclePathData={musclePathData}
              currentFrameIdx={currentFrame} 
              mode={heatmapMode} 
             />
           </div>
           <div className="h-64">
             <BodyVisualizer data={fpmtData} currentFrameIdx={currentFrame} mode={heatmapMode} />
           </div>
        </div>

        <div className="col-span-9 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
            <div className="col-span-5 bg-slate-900/40 rounded-xl border border-white/5 flex flex-col overflow-hidden backdrop-blur-sm shadow-inner">
              <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                  <LayoutGrid size={12} className="text-blue-500" />
                  Rolling Detail window
                </h3>
              </div>
              <div className="flex-1 p-2">
                 <HeatmapCanvas data={fpmtData} currentFrame={currentFrame} onFrameChange={setCurrentFrame} mode={heatmapMode} />
              </div>
            </div>
            <div className="col-span-7 flex flex-col overflow-hidden">
              <MuscleDetails data={fpmtData} currentFrameIdx={currentFrame} caps={muscleCaps} onCapsChange={setMuscleCaps} />
            </div>
          </div>

          <div className="h-44 bg-slate-900/40 rounded-xl border border-white/5 p-4 backdrop-blur-sm flex flex-col cursor-pointer hover:bg-slate-900/60 transition-colors group">
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Global Timeline Navigator (Total Net Force)</h3>
               <span className="text-[10px] font-mono text-blue-400 font-black">{fpmtData.frames[currentFrame].totalForce.toFixed(1)} N</span>
             </div>
             <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={fpmtData.frames} 
                  margin={{ top: 0, right: 0, left: -30, bottom: 0 }}
                  onClick={handleChartClick}
                >
                  <defs>
                    <linearGradient id="colorForce" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="frame" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fill: '#475569' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="totalForce" stroke="#3b82f6" fillOpacity={1} fill="url(#colorForce)" strokeWidth={1.5} isAnimationActive={false} />
                  <ReferenceLine x={fpmtData.frames[currentFrame].frame} stroke="#ffffff" strokeWidth={1} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>
      </main>

      <footer className="h-16 bg-slate-900/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between px-8 z-30">
        <div className="flex-1 flex items-center gap-8">
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Sim Clock</span>
              <span className="text-lg font-mono text-white font-black">{fpmtData.frames[currentFrame].time.toFixed(4)}s</span>
           </div>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center gap-2 bg-slate-950/50 p-1 px-4 rounded-xl border border-white/5 shadow-2xl">
            <button onClick={() => setIsLooping(!isLooping)} className={`p-1.5 transition-all ${isLooping ? 'text-blue-500' : 'text-slate-700'}`}>
              <Repeat size={16} />
            </button>
            <div className="w-[1px] h-4 bg-white/5 mx-1" />
            <button onClick={() => handleStep(-1)} className="p-1.5 text-slate-400 hover:text-white transition-all transform hover:scale-110 active:scale-95">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button onClick={handlePlayPause} className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 transform hover:scale-105 active:scale-90">
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
            </button>
            <button onClick={() => handleStep(1)} className="p-1.5 text-slate-400 hover:text-white transition-all transform hover:scale-110 active:scale-95">
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Velocity</span>
            <div className="flex items-center gap-2">
              <input 
                type="range" min="0.1" max="3" step="0.1" 
                value={playbackSpeed} 
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-24 accent-blue-600 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-mono w-6 text-blue-400 font-black">{playbackSpeed}x</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
