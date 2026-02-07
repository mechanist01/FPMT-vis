
import { MOTData, MOTFrame } from '../types';

export const parseMOT = (text: string): MOTData => {
  const lines = text.split(/\r?\n/);
  let headerEndIndex = -1;
  let inDegrees = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('indegrees=no')) inDegrees = false;
    if (line.includes('endheader')) {
      headerEndIndex = i;
      break;
    }
  }

  if (headerEndIndex === -1) throw new Error('Invalid MOT file: Missing endheader');

  const columnLine = lines[headerEndIndex + 1].trim();
  const columnNames = columnLine.split(/\s+/);
  
  const frames: MOTFrame[] = [];
  for (let i = headerEndIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/\s+/).map(v => parseFloat(v));
    const frameValues: Record<string, number> = {};
    
    columnNames.forEach((name, idx) => {
      frameValues[name] = values[idx];
    });

    frames.push({
      time: frameValues['time'] || 0,
      values: frameValues
    });
  }

  return { columnNames, frames, inDegrees };
};
