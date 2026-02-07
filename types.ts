
export interface MuscleData {
  name: string;
  fullName: string;
  displayName: string;
  laterality: 'R' | 'L' | 'Other';
}

export interface FrameData {
  frame: number;
  time: number;
  totalForce: number;
  muscleForces: Record<string, number>;
  pathwayLower: Record<string, number>;
  pathwayUpper: Record<string, number>;
}

export interface MarkerPoint {
  x: number;
  y: number;
  z: number;
}

export interface TRCFrame {
  frame: number;
  time: number;
  markers: Record<string, MarkerPoint>;
}

export interface TRCData {
  markerNames: string[];
  frames: TRCFrame[];
  dataRate: number;
}

export interface MOTFrame {
  time: number;
  values: Record<string, number>;
}

export interface MOTData {
  columnNames: string[];
  frames: MOTFrame[];
  inDegrees: boolean;
}

export interface MusclePathPoint {
  frame: string;
  location: [number, number, number];
  name?: string;
}

export interface MusclePath {
  muscle: string;
  points: MusclePathPoint[];
}

export interface MusclePathData {
  model: string;
  muscles: MusclePath[];
}

export interface FPMTData {
  frames: FrameData[];
  muscleNames: MuscleData[];
  maxForce: number;
  maxPathwayWidth: number;
}

export enum SortOrder {
  Anatomical = 'Anatomical',
  ForceDescending = 'ForceDescending'
}
