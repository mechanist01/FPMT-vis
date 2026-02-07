
import { TRCData, TRCFrame, MarkerPoint } from '../types';

export const parseTRC = (text: string): TRCData => {
  const lines = text.split(/\r?\n/);
  if (lines.length < 6) throw new Error('Invalid TRC file.');

  // Line 2 contains DataRate
  const dataRate = parseFloat(lines[2].trim().split(/\s+/)[0]) || 60;

  // Line 4 contains Marker Names (starting at col 3)
  const markerNamesRaw = lines[3].trim().split(/\s+/).slice(2);
  // Clean empty markers if any
  const markerNames = markerNamesRaw.filter(n => n.trim() !== '');

  const frames: TRCFrame[] = [];

  // Data starts at Line 7 (index 6)
  for (let i = 6; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(/\s+/);
    const frameNum = parseInt(cols[0]);
    const time = parseFloat(cols[1]);
    
    const markers: Record<string, MarkerPoint> = {};
    
    markerNames.forEach((name, idx) => {
      const baseIdx = 2 + idx * 3;
      markers[name] = {
        x: parseFloat(cols[baseIdx]) || 0,
        y: parseFloat(cols[baseIdx + 1]) || 0,
        z: parseFloat(cols[baseIdx + 2]) || 0
      };
    });

    frames.push({ frame: frameNum, time, markers });
  }

  return { markerNames, frames, dataRate };
};
