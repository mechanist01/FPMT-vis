
import React, { useState, useMemo } from 'react';
import { FPMTData, SortOrder, MuscleData } from '../types';
import { Search, Plus, RotateCcw, AlertCircle, TrendingDown } from 'lucide-react';

interface MuscleDetailsProps {
  data: FPMTData;
  currentFrameIdx: number;
  caps: Record<string, number>;
  onCapsChange: (caps: Record<string, number>) => void;
}

const MuscleDetails: React.FC<MuscleDetailsProps> = ({ data, currentFrameIdx, caps, onCapsChange }) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Anatomical);
  const [searchTerm, setSearchTerm] = useState('');
  const [capInput, setCapInput] = useState<{ muscle: string; value: string }>({ muscle: '', value: '' });
  
  const currentFrame = data.frames[currentFrameIdx];

  const modifiedData = useMemo(() => {
    const frame = currentFrame;
    const cappedUpper: Record<string, number> = { ...frame.pathwayUpper };
    const cappedLower: Record<string, number> = { ...frame.pathwayLower };
    let isInfeasible = false;

    (Object.entries(caps) as [string, number][]).forEach(([muscleName, capValue]) => {
      if ((frame.muscleForces[muscleName] ?? 0) > capValue) {
        isInfeasible = true;
      }
      cappedUpper[muscleName] = Math.min(cappedUpper[muscleName] ?? Infinity, capValue);
    });

    return { cappedUpper, cappedLower, isInfeasible };
  }, [currentFrame, caps]);

  const groupedMuscles = useMemo(() => {
    const filtered = data.muscleNames.filter(m => 
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortOrder === SortOrder.ForceDescending) {
      filtered.sort((a, b) => (currentFrame.muscleForces[b.name] || 0) - (currentFrame.muscleForces[a.name] || 0));
    }

    return {
      right: filtered.filter(m => m.laterality === 'R'),
      left: filtered.filter(m => m.laterality === 'L'),
      other: filtered.filter(m => m.laterality === 'Other')
    };
  }, [data.muscleNames, sortOrder, currentFrame.muscleForces, searchTerm]);

  const handleAddCap = () => {
    if (!capInput.muscle || isNaN(parseFloat(capInput.value))) return;
    onCapsChange({ ...caps, [capInput.muscle]: parseFloat(capInput.value) });
    setCapInput({ muscle: '', value: '' });
  };

  const renderMuscleRow = (m: MuscleData) => {
    const force = currentFrame.muscleForces[m.name] || 0;
    const origLower = currentFrame.pathwayLower[m.name] || 0;
    const origUpper = currentFrame.pathwayUpper[m.name] || 0;
    const cappedLower = modifiedData.cappedLower[m.name] || 0;
    const cappedUpper = modifiedData.cappedUpper[m.name] || 0;

    const isCapped = caps[m.name] !== undefined;
    const forcePct = data.maxForce > 0 ? (force / data.maxForce) * 100 : 0;
    const maxWidth = data.maxPathwayWidth > 0 ? data.maxPathwayWidth : 1;

    return (
      <div key={m.name} className="group flex flex-col gap-0.5 py-1 border-b border-white/[0.02]">
        <div className="flex justify-between items-baseline gap-1">
          <span className={`text-[9px] font-bold truncate tracking-tight ${isCapped ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
            {m.displayName}
          </span>
          <span className="text-[8px] font-mono text-slate-500 font-bold whitespace-nowrap">{force.toFixed(1)}N</span>
        </div>
        
        <div className="h-0.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${isCapped ? 'bg-blue-400' : 'bg-blue-600'}`}
            style={{ width: `${forcePct}%` }}
          />
        </div>

        <div className="relative h-1.5 bg-slate-900/40 rounded-sm overflow-hidden mt-0.5">
          <div 
            className="absolute h-full bg-slate-700/20"
            style={{
              left: `${(origLower / maxWidth) * 100}%`,
              width: `${((origUpper - origLower) / maxWidth) * 100}%`
            }}
          />
          <div 
            className={`absolute h-full ${modifiedData.isInfeasible ? 'bg-red-500/20' : 'bg-emerald-500/20'} border-x border-emerald-500/40`}
            style={{
              left: `${(cappedLower / maxWidth) * 100}%`,
              width: `${(Math.max(0, cappedUpper - cappedLower) / maxWidth) * 100}%`
            }}
          />
          <div 
            className="absolute h-full w-[1px] bg-white/60 z-10"
            style={{ left: `${(force / maxWidth) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="bg-slate-950/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
           <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
             <TrendingDown size={12} />
             Constraints
           </h3>
           {Object.keys(caps).length > 0 && (
             <button onClick={() => onCapsChange({})} className="text-[8px] font-bold text-slate-500 hover:text-white flex items-center gap-1 uppercase">
               <RotateCcw size={8} /> Reset
             </button>
           )}
        </div>

        <div className="flex gap-1">
          <select 
            value={capInput.muscle}
            onChange={(e) => setCapInput({...capInput, muscle: e.target.value})}
            className="flex-1 bg-slate-800 text-[9px] border border-slate-700 rounded px-1.5 py-1 outline-none"
          >
            <option value="">Limit Muscle...</option>
            {data.muscleNames.map(m => (
              <option key={m.name} value={m.name}>{m.displayName}</option>
            ))}
          </select>
          <input 
            type="number"
            placeholder="N"
            value={capInput.value}
            onChange={(e) => setCapInput({...capInput, value: e.target.value})}
            className="w-12 bg-slate-800 text-[9px] border border-slate-700 rounded px-1.5 outline-none"
          />
          <button onClick={handleAddCap} className="p-1 bg-blue-600 rounded hover:bg-blue-500 transition-colors">
            <Plus size={12} />
          </button>
        </div>

        {modifiedData.isInfeasible && (
          <div className="p-1.5 rounded bg-red-900/30 border border-red-500/30 text-[8px] text-red-200 font-bold flex items-center gap-1.5">
            <AlertCircle size={10} /> INFEASIBLE
          </div>
        )}
      </div>

      <div className="p-2 bg-white/[0.02] border-y border-white/5 flex items-center justify-between gap-2">
         <div className="flex items-center gap-1.5 flex-1">
            <Search size={12} className="text-slate-500" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter..."
              className="bg-transparent text-[9px] outline-none w-full"
            />
         </div>
         <button 
           onClick={() => setSortOrder(sortOrder === SortOrder.Anatomical ? SortOrder.ForceDescending : SortOrder.Anatomical)}
           className="text-[8px] font-black uppercase tracking-tighter text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded"
          >
            {sortOrder === SortOrder.Anatomical ? 'Anatomy' : 'Force'}
         </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {groupedMuscles.other.length > 0 && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Axial / Trunk</h4>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-500/20 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              {groupedMuscles.other.map(renderMuscleRow)}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-4">
          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em]">Left Side</h4>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
            </div>
            <div className="space-y-0.5">
              {groupedMuscles.left.map(renderMuscleRow)}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Right Side</h4>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
            </div>
            <div className="space-y-0.5">
              {groupedMuscles.right.map(renderMuscleRow)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MuscleDetails;
