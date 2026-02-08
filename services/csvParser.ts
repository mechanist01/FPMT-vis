
import { FrameData, MuscleData, FPMTData } from '../types';
import { MUSCLE_NAME_MAP } from '../constants';

const getDisplayName = (name: string): string => {
  let clean = name.toLowerCase();
  let side = '';
  
  if (clean.endsWith('_r')) {
    clean = clean.slice(0, -2);
    side = ' (R)';
  } else if (clean.endsWith('_l')) {
    clean = clean.slice(0, -2);
    side = ' (L)';
  }

  // Try to find a match in our map
  for (const [key, label] of Object.entries(MUSCLE_NAME_MAP)) {
    if (clean.startsWith(key)) {
      const suffix = clean.replace(key, '').replace(/_/g, ' ').trim();
      return `${label}${suffix ? ' ' + suffix : ''}${side}`;
    }
  }

  // Fallback: capitalize and replace underscores
  return clean.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + side;
};

export const parseFPMTCSV = (csvText: string): FPMTData => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error('CSV is empty or invalid.');

  const headers = lines[0].split(',').map(h => h.trim());
  
  const frameIdx = headers.indexOf('frame');
  const timeIdx = headers.indexOf('time');
  
  const muscleIndices: { name: string; idx: number; fullName: string }[] = [];

  headers.forEach((h, idx) => {
    // STRICT RULE: Only headers starting with 'muscle_' are considered force columns.
    if (h.startsWith('muscle_')) {
      const name = h.replace('muscle_', '');
      muscleIndices.push({ name, idx, fullName: h });
    }
  });

  const muscleNames: MuscleData[] = muscleIndices.map(m => {
    let laterality: 'R' | 'L' | 'Other' = 'Other';
    if (m.name.endsWith('_r')) laterality = 'R';
    else if (m.name.endsWith('_l')) laterality = 'L';
    return { 
      name: m.name, 
      fullName: m.fullName, 
      displayName: getDisplayName(m.name),
      laterality 
    };
  });

  // Sort muscles by R, then L, then Other
  muscleNames.sort((a, b) => {
    const latOrder = { 'R': 1, 'L': 2, 'Other': 3 };
    if (latOrder[a.laterality] !== latOrder[b.laterality]) {
      return latOrder[a.laterality] - latOrder[b.laterality];
    }
    return a.name.localeCompare(b.name);
  });

  const frames: FrameData[] = [];
  let globalMaxForce = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < headers.length) continue;

    const frame = parseInt(cols[frameIdx]) || (i - 1);
    const time = parseFloat(cols[timeIdx]) || 0;
    
    let totalForce = 0;
    const muscleForces: Record<string, number> = {};

    muscleIndices.forEach(m => {
      const force = parseFloat(cols[m.idx]) || 0;
      muscleForces[m.name] = force;
      totalForce += force;
      if (force > globalMaxForce) globalMaxForce = force;
    });

    frames.push({
      frame,
      time,
      totalForce,
      status: headers.includes('status') ? cols[headers.indexOf('status')] : undefined,
      muscleForces,
      pathwayLower: {},
      pathwayUpper: {}
    });
  }

  return {
    frames,
    muscleNames,
    maxForce: globalMaxForce,
    maxPathwayWidth: 0 // Initialized as 0 until Pathway CSV is merged
  };
};
