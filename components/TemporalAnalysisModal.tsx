import React from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FPMTData, MuscleData } from '../types';

interface TemporalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  muscle: MuscleData | null;
  data: FPMTData;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
}

const TemporalAnalysisModal: React.FC<TemporalAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  muscle, 
  data, 
  currentFrame,
  onFrameChange 
}) => {
  if (!isOpen || !muscle) return null;

  const chartData = data.frames.map(f => ({
    frame: f.frame,
    time: f.time,
    force: f.muscleForces[muscle.name] || 0,
    lower: f.pathwayLower[muscle.name] || 0,
    upper: f.pathwayUpper[muscle.name] || 0,
    status: f.status
  }));

  const currentVal = data.frames[currentFrame].muscleForces[muscle.name] || 0;
  const currentUpper = data.frames[currentFrame].pathwayUpper[muscle.name] || 0;
  const isViolated = currentVal > currentUpper && currentUpper > 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
      <div className="w-full max-w-6xl h-[80vh] bg-slate-900 rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                 <TrendingUp size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Pathway Temporal Analysis</h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-[10px] font-black px-2 py-0.5 bg-blue-500 text-white rounded uppercase tracking-widest">{muscle.displayName}</span>
                   <div className="flex items-center gap-1.5">
                      {isViolated ? (
                        <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle size={12} /> Limit Violated
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Within Bounds
                        </span>
                      )}
                   </div>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
           </button>
        </header>

        <main className="flex-1 p-8 min-h-0 flex flex-col">
          <div className="flex-1 bg-slate-950/50 rounded-2xl border border-white/5 p-4 shadow-inner relative">
            <ResponsiveContainer width="100%" height="100%">
              {/* Fix: Explicitly cast e.activeTooltipIndex to a number to match onFrameChange's expected type */}
              <ComposedChart data={chartData} onClick={(e) => e && onFrameChange(Number(e.activeTooltipIndex) || 0)}>
                <defs>
                  <linearGradient id="pathwayFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: '#475569' }} 
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#475569' }} 
                  label={{ value: 'Force (N)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                
                {/* Pathway Shaded Area */}
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="none" 
                  fill="url(#pathwayFill)" 
                  isAnimationActive={false}
                />
                
                {/* Bounds Lines */}
                <Line 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#10b981" 
                  strokeWidth={1} 
                  strokeDasharray="4 4" 
                  dot={false} 
                  isAnimationActive={false}
                />
                
                {/* Main Force Line */}
                <Line 
                  type="monotone" 
                  dataKey="force" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
                  isAnimationActive={false}
                />

                <ReferenceLine x={data.frames[currentFrame].time} stroke="#fff" strokeWidth={1} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-6">
             <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current Force</span>
                <span className="text-2xl font-mono text-blue-400 font-black">{currentVal.toFixed(2)} N</span>
             </div>
             <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Lower Bound</span>
                <span className="text-2xl font-mono text-emerald-500 font-black">{(data.frames[currentFrame].pathwayLower[muscle.name] || 0).toFixed(2)} N</span>
             </div>
             <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Upper Bound</span>
                <span className="text-2xl font-mono text-emerald-500 font-black">{currentUpper.toFixed(2)} N</span>
             </div>
             <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Feasibility Gap</span>
                <span className={`text-2xl font-mono font-black ${isViolated ? 'text-rose-500' : 'text-slate-400'}`}>
                  {isViolated ? `+${(currentVal - currentUpper).toFixed(2)} N` : 'OK'}
                </span>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TemporalAnalysisModal;