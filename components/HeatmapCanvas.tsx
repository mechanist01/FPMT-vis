
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { FPMTData } from '../types';
import { COLOR_SCALE } from '../constants';
import * as d3 from 'd3';

interface HeatmapCanvasProps {
  data: FPMTData;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  mode: 'force' | 'range' | 'normalized';
}

const WINDOW_SIZE = 60; // Total frames to show in the detailed window

const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({ data, currentFrame, onFrameChange, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate the sliding window of frames to show
  const windowRange = useMemo(() => {
    const numFrames = data.frames.length;
    let start = Math.max(0, currentFrame - Math.floor(WINDOW_SIZE / 2));
    let end = Math.min(numFrames, start + WINDOW_SIZE);
    
    // Adjust start if end hit the boundary to keep window size constant
    if (end === numFrames) {
      start = Math.max(0, end - WINDOW_SIZE);
    }
    
    return { start, end, count: end - start };
  }, [data.frames.length, currentFrame]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const numMuscles = data.muscleNames.length;

    const cellWidth = width / windowRange.count;
    const cellHeight = height / numMuscles;

    ctx.clearRect(0, 0, width, height);

    // Color interpolation
    const colorInterpolator = d3.interpolateRgbBasis(COLOR_SCALE);

    data.muscleNames.forEach((muscle, mIdx) => {
      // Only render frames within the window
      for (let i = 0; i < windowRange.count; i++) {
        const fIdx = windowRange.start + i;
        const frame = data.frames[fIdx];
        if (!frame) continue;

        let value = 0;
        let normalized = 0;

        if (mode === 'force') {
          value = frame.muscleForces[muscle.name] || 0;
          normalized = data.maxForce > 0 ? value / data.maxForce : 0;
        } else if (mode === 'range') {
          const upper = frame.pathwayUpper[muscle.name] || 0;
          const lower = frame.pathwayLower[muscle.name] || 0;
          value = upper - lower;
          normalized = data.maxPathwayWidth > 0 ? value / data.maxPathwayWidth : 0;
        } else {
          // Normalized by per-muscle max across ALL frames
          const muscleForces = data.frames.map(f => f.muscleForces[muscle.name] || 0);
          const maxM = Math.max(...muscleForces);
          value = frame.muscleForces[muscle.name] || 0;
          normalized = maxM > 0 ? value / maxM : 0;
        }

        ctx.fillStyle = colorInterpolator(normalized);
        ctx.fillRect(i * cellWidth, mIdx * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
      }
    });

    // Draw grid lines for frames (optional, light)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < windowRange.count; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
      ctx.stroke();
    }

    // Draw active cursor (centered frame in window)
    const cursorOffset = currentFrame - windowRange.start;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(cursorOffset * cellWidth + cellWidth / 2, 0);
    ctx.lineTo(cursorOffset * cellWidth + cellWidth / 2, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [data, currentFrame, mode, windowRange]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        render();
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [render]);

  useEffect(() => {
    render();
  }, [render, currentFrame, mode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current || !data) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const windowRelativeIndex = Math.floor((x / rect.width) * windowRange.count);
    const absoluteFrameIndex = windowRange.start + windowRelativeIndex;
    onFrameChange(Math.max(0, Math.min(data.frames.length - 1, absoluteFrameIndex)));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair bg-slate-950 rounded overflow-hidden">
      <div className="absolute top-2 left-2 z-10 pointer-events-none bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/5">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
          Local Window: Frames {windowRange.start}-{windowRange.end-1}
        </span>
      </div>
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} />
    </div>
  );
};

export default HeatmapCanvas;
