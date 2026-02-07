
export const MUSCLE_NAME_MAP: Record<string, string> = {
  'glut_med': 'Gluteus Medius',
  'glut_min': 'Gluteus Minimus',
  'glut_max': 'Gluteus Maximus',
  'iliacus': 'Iliacus',
  'psoas': 'Psoas',
  'tfl': 'Tensor Fasciae Latae',
  'rect_fem': 'Rectus Femoris',
  'vas_med': 'Vastus Medialis',
  'vas_lat': 'Vastus Lateralis',
  'vas_int': 'Vastus Intermedius',
  'med_gas': 'Medial Gastrocnemius',
  'lat_gas': 'Lateral Gastrocnemius',
  'soleus': 'Soleus',
  'tib_ant': 'Tibialis Anterior',
  'tib_post': 'Tibialis Posterior',
  'per_long': 'Peroneus Longus',
  'per_brev': 'Peroneus Brevis',
  'ercspn': 'Erector Spinae',
  'intobl': 'Internal Oblique',
  'extobl': 'External Oblique',
  'add_long': 'Adductor Longus',
  'add_brev': 'Adductor Brevis',
  'add_mag': 'Adductor Magnus',
  'bicep_fem': 'Biceps Femoris',
  'semimem': 'Semimembranosus',
  'semiten': 'Semitendinosus',
  'grac': 'Gracilis',
  'sart': 'Sartorius',
  'pect': 'Pectineus'
};

export const MUSCLE_REGIONS = {
  TRUNK: ['ercspn', 'intobl', 'extobl'],
  LEG_R: [
    'glut', 'tfl', 'iliacus', 'psoas', 
    'rect_fem', 'vas', 'med_gas', 'lat_gas', 'soleus',
    'tib', 'per', 'flex', 'ext', 'add', 'bicep', 'semi', 'grac', 'sart', 'pect'
  ],
  LEG_L: [
    'glut', 'tfl', 'iliacus', 'psoas', 
    'rect_fem', 'vas', 'med_gas', 'lat_gas', 'soleus',
    'tib', 'per', 'flex', 'ext', 'add', 'bicep', 'semi', 'grac', 'sart', 'pect'
  ]
};

export const COLOR_SCALE = [
  '#440154', // Viridis start
  '#482878',
  '#3e4989',
  '#31688e',
  '#26828e',
  '#1f9e89',
  '#35b779',
  '#6ece58',
  '#addc30',
  '#fde725'  // Viridis end
];
