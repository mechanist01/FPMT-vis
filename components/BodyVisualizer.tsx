
import React from 'react';
import { FrameData, MuscleData, FPMTData } from '../types';
import { MUSCLE_REGIONS, COLOR_SCALE } from '../constants';
import * as d3 from 'd3';

interface BodyVisualizerProps {
  data: FPMTData;
  currentFrameIdx: number;
  mode: 'force' | 'range' | 'normalized';
}

const BodyVisualizer: React.FC<BodyVisualizerProps> = ({ data, currentFrameIdx, mode }) => {
  const currentFrame = data.frames[currentFrameIdx];
  const colorInterpolator = d3.interpolateRgbBasis(COLOR_SCALE);

  const getIntensity = (region: keyof typeof MUSCLE_REGIONS, lat?: 'R' | 'L') => {
    const musclePrefixes = MUSCLE_REGIONS[region];
    const filteredMuscles = data.muscleNames.filter(m => {
      const isBaseMatch = musclePrefixes.some(p => m.name.startsWith(p));
      if (!isBaseMatch) return false;
      if (lat) return m.laterality === lat;
      return true;
    });

    if (filteredMuscles.length === 0) return 0;
    
    let sumNormalized = 0;
    filteredMuscles.forEach(m => {
      if (mode === 'force') {
        const val = currentFrame.muscleForces[m.name] || 0;
        sumNormalized += data.maxForce > 0 ? val / data.maxForce : 0;
      } else if (mode === 'range') {
        const upper = currentFrame.pathwayUpper[m.name] || 0;
        const lower = currentFrame.pathwayLower[m.name] || 0;
        const val = upper - lower;
        sumNormalized += data.maxPathwayWidth > 0 ? val / data.maxPathwayWidth : 0;
      } else {
        // Normalized by per-muscle max
        const muscleForces = data.frames.map(f => f.muscleForces[m.name] || 0);
        const maxM = Math.max(...muscleForces);
        const val = currentFrame.muscleForces[m.name] || 0;
        sumNormalized += maxM > 0 ? val / maxM : 0;
      }
    });

    return Math.min(1, sumNormalized / filteredMuscles.length);
  };

  const trunkColor = colorInterpolator(getIntensity('TRUNK'));
  const rightLegColor = colorInterpolator(getIntensity('LEG_R', 'R'));
  const leftLegColor = colorInterpolator(getIntensity('LEG_L', 'L'));

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-xl shadow-xl border border-white/5 h-full backdrop-blur-md">
      <h3 className="text-[10px] font-black mb-4 uppercase tracking-[0.2em] text-slate-500">Regional Activation ({mode})</h3>
      <svg width="120" height="240" viewBox="0 0 100 200" className="drop-shadow-2xl">
        {/* Head */}
        <circle cx="50" cy="20" r="12" fill="#1e293b" />
        {/* Torso */}
        <rect x="35" y="35" width="30" height="60" rx="4" fill={trunkColor} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {/* Right Leg */}
        <path d="M 52 95 L 60 140 L 60 190 L 50 190 L 50 140 L 52 95" fill={rightLegColor} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {/* Left Leg */}
        <path d="M 48 95 L 40 140 L 40 190 L 50 190 L 50 140 L 48 95" fill={leftLegColor} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {/* Right Arm */}
        <path d="M 65 40 L 85 70 L 80 75 L 65 45" fill="#1e293b" />
        {/* Left Arm */}
        <path d="M 35 40 L 15 70 L 20 75 L 35 45" fill="#1e293b" />
      </svg>
      <div className="mt-6 grid grid-cols-1 gap-2 text-[9px] w-full font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: trunkColor }}></div>
          <span>Trunk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rightLegColor }}></div>
          <span>Leg (R)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: leftLegColor }}></div>
          <span>Leg (L)</span>
        </div>
      </div>
    </div>
  );
};

export default BodyVisualizer;
