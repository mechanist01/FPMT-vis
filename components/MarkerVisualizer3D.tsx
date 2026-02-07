
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { FPMTData, MusclePathData, MOTData } from '../types';
import { COLOR_SCALE } from '../constants';
import * as d3 from 'd3';

interface MarkerVisualizer3DProps {
  fpmtData: FPMTData;
  motData?: MOTData | null;
  musclePathData?: MusclePathData | null;
  currentFrameIdx: number;
  mode: 'force' | 'range' | 'normalized';
}

const MarkerVisualizer3D: React.FC<MarkerVisualizer3DProps> = ({ 
  fpmtData, 
  motData,
  musclePathData, 
  currentFrameIdx, 
  mode 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  const colorInterpolator = d3.interpolateRgbBasis(COLOR_SCALE);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.01, 100);
    camera.position.set(0.8, 1.2, 1.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.9, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 2, 1);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(10, 20, 0x1e293b, 0x0f172a);
    scene.add(grid);

    const modelGroup = new THREE.Group();
    // OpenSim to Three.js orientation: OpenSim X is forward, Y is up, Z is right.
    // Standard Three.js Z is forward, Y is up, X is right.
    // We rotate -90 around Y to make OpenSim X look into -Z.
    modelGroup.rotation.y = -Math.PI / 2;
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!modelGroupRef.current || !fpmtData) return;
    const group = modelGroupRef.current;
    group.clear();

    const degToRad = (deg: number) => deg * (Math.PI / 180);
    const frameGroups: Record<string, THREE.Group> = {};
    
    // Get kinematic values for current frame
    const v = (motData && motData.frames[currentFrameIdx]) 
      ? motData.frames[currentFrameIdx].values 
      : {};

    // 1. Pelvis
    const pelvis = new THREE.Group();
    pelvis.name = "pelvis";
    pelvis.position.set(v['pelvis_tx'] || 0, v['pelvis_ty'] || 0.95, v['pelvis_tz'] || 0);
    pelvis.rotation.order = 'ZXY'; // OpenSim rotation sequence
    pelvis.rotation.set(
      degToRad(v['pelvis_list'] || 0),
      degToRad(v['pelvis_rotation'] || 0),
      degToRad(v['pelvis_tilt'] || 0)
    );
    group.add(pelvis);
    frameGroups["pelvis"] = pelvis;

    // 2. Torso
    const torso = new THREE.Group();
    torso.name = "torso";
    // Torso rotations can be added here if MOT has them (lumbar_extension, etc.)
    pelvis.add(torso);
    frameGroups["torso"] = torso;

    // 3. Legs
    const sides: ('r' | 'l')[] = ['r', 'l'];
    sides.forEach(s => {
      const sideMult = s === 'r' ? 1 : -1;
      
      const femur = new THREE.Group();
      femur.name = `femur_${s}`;
      femur.position.set(-0.07, -0.06, 0.08 * sideMult);
      femur.rotation.order = 'ZXY';
      femur.rotation.set(
        degToRad(v[`hip_adduction_${s}`] || 0),
        degToRad(v[`hip_rotation_${s}`] || 0),
        degToRad(v[`hip_flexion_${s}`] || 0)
      );
      pelvis.add(femur);
      frameGroups[`femur_${s}`] = femur;

      const tibia = new THREE.Group();
      tibia.name = `tibia_${s}`;
      tibia.position.set(0, -0.42, 0);
      tibia.rotation.z = degToRad(v[`knee_angle_${s}`] || 0);
      femur.add(tibia);
      frameGroups[`tibia_${s}`] = tibia;

      const calcn = new THREE.Group();
      calcn.name = `calcn_${s}`;
      calcn.position.set(0, -0.43, 0);
      calcn.rotation.z = degToRad(v[`ankle_angle_${s}`] || 0);
      tibia.add(calcn);
      frameGroups[`calcn_${s}`] = calcn;

      const toes = new THREE.Group();
      toes.name = `toes_${s}`;
      toes.position.set(0.18, 0, 0);
      calcn.add(toes);
      frameGroups[`toes_${s}`] = toes;
    });

    group.updateMatrixWorld(true);

    // 4. Render Muscle Paths
    if (musclePathData) {
      const frameData = fpmtData.frames[currentFrameIdx];
      
      musclePathData.muscles.forEach(mp => {
        const force = frameData.muscleForces[mp.muscle] || 0;
        const upper = frameData.pathwayUpper[mp.muscle] || 0;
        const lower = frameData.pathwayLower[mp.muscle] || 0;
        
        let intensity = 0;
        if (mode === 'force') {
          intensity = fpmtData.maxForce > 0 ? force / fpmtData.maxForce : 0;
        } else if (mode === 'range') {
          intensity = fpmtData.maxPathwayWidth > 0 ? (upper - lower) / fpmtData.maxPathwayWidth : 0;
        } else {
          const muscleForces = fpmtData.frames.map(f => f.muscleForces[mp.muscle] || 0);
          const maxM = Math.max(...muscleForces);
          intensity = maxM > 0 ? force / maxM : 0;
        }

        const points: THREE.Vector3[] = [];
        mp.points.forEach(p => {
          const frameObj = frameGroups[p.frame];
          if (frameObj) {
            const localPos = new THREE.Vector3(...p.location);
            const worldPos = localPos.applyMatrix4(frameObj.matrixWorld);
            points.push(worldPos);
          }
        });

        if (points.length > 1) {
          const curve = new THREE.CatmullRomCurve3(points);
          // Slightly dynamic tube thickness based on intensity
          const tubeGeom = new THREE.TubeGeometry(curve, 12, 0.003 + (intensity * 0.01), 6, false);
          const matColor = colorInterpolator(intensity);
          const mat = new THREE.MeshPhongMaterial({ 
            color: matColor,
            emissive: matColor,
            emissiveIntensity: 0.3 + intensity,
            transparent: true,
            opacity: 0.9
          });
          const tube = new THREE.Mesh(tubeGeom, mat);
          group.add(tube);
        }
      });
    }
  }, [currentFrameIdx, musclePathData, fpmtData, motData, mode]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
       <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">Kinetic Spatial Projection</h3>
          </div>
          <p className="text-[9px] text-slate-500 font-bold ml-4 uppercase">
            {motData ? 'Animated Muscle Mesh' : 'Static Muscle Model'}
          </p>
       </div>
       <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default MarkerVisualizer3D;
