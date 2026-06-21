// Health Challenges Data Structure

export interface HealthChallenge {
  id: string;
  title: string;
  objective: string;
  duration: number; // in minutes
  exercises: ChallengeExercise[];
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  equipment: string[];
  points?: number;
  icon?: string;
  color?: string;
}

export interface ChallengeExercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: number; // in seconds
  rest?: number; // in seconds
  instructions: string[];
  tips?: string[];
}

export const HEALTH_CHALLENGES: HealthChallenge[] = [
  // 1. Ultimate Core Workout (45 Minutes)
  {
    id: 'hc1',
    title: 'Ultimate Core Workout',
    objective: 'Activate deep core + build visible strength',
    duration: 45,
    category: 'Core',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'core',
    color: 'orange',
    exercises: [
      {
        name: 'Plank',
        sets: 3,
        reps: '45 sec',
        duration: 45,
        rest: 30,
        instructions: [
          'Start in push-up position',
          'Lower onto forearms',
          'Keep body in straight line',
          'Engage core muscles',
          'Hold position'
        ],
        tips: [
          'Keep spine neutral',
          'Avoid hip sagging',
          'Breathe steadily',
          'Squeeze glutes and abs'
        ]
      },
      {
        name: 'Dead Bug',
        sets: 3,
        reps: '12',
        duration: 30,
        rest: 30,
        instructions: [
          'Lie on back with knees bent',
          'Arms extended toward ceiling',
          'Slowly lower opposite arm and leg',
          'Return to start position',
          'Alternate sides'
        ],
        tips: [
          'Opposite arm-leg extend slowly',
          'Keep lower back on ground',
          'Control the movement',
          'Breathe throughout'
        ]
      },
      {
        name: 'Bicycle Crunch',
        sets: 3,
        reps: '20',
        duration: 45,
        rest: 30,
        instructions: [
          'Lie on back with hands behind head',
          'Bring knees to tabletop position',
          'Extend right leg while rotating left elbow to right knee',
          'Alternate sides continuously'
        ],
        tips: [
          'Twist torso, not just legs',
          'Keep lower back pressed down',
          'Shoulder blades off ground',
          'Controlled pace'
        ]
      },
      {
        name: 'Leg Raises',
        sets: 3,
        reps: '15',
        duration: 30,
        rest: 30,
        instructions: [
          'Lie on back with hands under hips',
          'Keep legs straight',
          'Slowly raise legs to 90 degrees',
          'Lower with control',
          'Avoid swinging'
        ],
        tips: [
          'Keep lower back pressed down',
          'Control the movement',
          'Point toes',
          'Breathe steadily'
        ]
      },
      {
        name: 'Russian Twists',
        sets: 3,
        reps: '30',
        duration: 45,
        rest: 30,
        instructions: [
          'Sit on ground with knees bent',
          'Lean back slightly',
          'Lift feet off ground',
          'Rotate torso side to side',
          'Tap hands beside hips'
        ],
        tips: [
          'Keep chest lifted',
          'Control the rotation',
          'Use obliques',
          'Avoid using momentum'
        ]
      }
    ]
  },

  // 2. Lower Body Strength Builder (45 Minutes)
  {
    id: 'hc2',
    title: 'Lower Body Strength Builder',
    objective: 'Glutes + legs strength',
    duration: 45,
    category: 'Lower Body',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'legs',
    color: 'blue',
    exercises: [
      {
        name: 'Squats',
        sets: 4,
        reps: '15',
        duration: 60,
        rest: 45,
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower hips back and down',
          'Keep chest up and back straight',
          'Lower until thighs parallel to ground',
          'Drive through heels to return'
        ],
        tips: [
          'Knees aligned with toes',
          'Keep weight in heels',
          'Chest up and back straight',
          'Go as low as comfortable'
        ]
      },
      {
        name: 'Lunges',
        sets: 3,
        reps: '12/leg',
        duration: 45,
        rest: 30,
        instructions: [
          'Step forward with one leg',
          'Lower hips until both knees at 90 degrees',
          'Back knee should hover above ground',
          'Push through front heel to return',
          'Alternate legs'
        ],
        tips: [
          'Drop straight down, not forward',
          'Keep front knee behind toes',
          'Maintain upright torso',
          'Control movement'
        ]
      },
      {
        name: 'Glute Bridge',
        sets: 3,
        reps: '20',
        duration: 30,
        rest: 30,
        instructions: [
          'Lie on back with knees bent',
          'Feet flat on ground hip-width apart',
          'Drive hips upward',
          'Squeeze glutes at top',
          'Lower with control'
        ],
        tips: [
          'Push through heels',
          'Squeeze glutes',
          'Avoid arching back',
          'Control the movement'
        ]
      },
      {
        name: 'Wall Sit',
        sets: 3,
        reps: '60 sec',
        duration: 60,
        rest: 45,
        instructions: [
          'Lean against wall with feet forward',
          'Slide down until thighs parallel to ground',
          'Keep back against wall',
          'Hold position',
          'Use hands for balance if needed'
        ],
        tips: [
          'Keep thighs parallel',
          'Back flat against wall',
          'Engage quads',
          'Breathe steadily'
        ]
      }
    ]
  },

  // 3. Upper Body Sculpt (40 Minutes)
  {
    id: 'hc3',
    title: 'Upper Body Sculpt',
    objective: 'Chest, shoulders, arms definition',
    duration: 40,
    category: 'Upper Body',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'upper',
    color: 'purple',
    exercises: [
      {
        name: 'Push-ups',
        sets: 4,
        reps: '10',
        duration: 45,
        rest: 45,
        instructions: [
          'Start in high plank position',
          'Lower body until chest near ground',
          'Keep elbows at 45-degree angle',
          'Push back up to start',
          'Maintain straight line'
        ],
        tips: [
          'Elbows at ~45°',
          'Keep core engaged',
          'Full range of motion',
          'Control movement'
        ]
      },
      {
        name: 'Pike Push-ups',
        sets: 3,
        reps: '8',
        duration: 40,
        rest: 45,
        instructions: [
          'Start in downward dog position',
          'Lower head toward ground',
          'Bend elbows back',
          'Push back up to start',
          'Keep hips high'
        ],
        tips: [
          'Keep shoulders stable',
          'Control movement',
          'Engage shoulders',
          'Avoid straining neck'
        ]
      },
      {
        name: 'Tricep Dips',
        sets: 3,
        reps: '12',
        duration: 30,
        rest: 45,
        instructions: [
          'Use parallel bars or chair edge',
          'Support body on straight arms',
          'Lower by bending elbows',
          'Push back up to start',
          'Keep chest up'
        ],
        tips: [
          'Keep shoulders stable',
          'Full range of motion',
          'Control movement',
          'Avoid swinging'
        ]
      },
      {
        name: 'Plank Shoulder Taps',
        sets: 3,
        reps: '20',
        duration: 40,
        rest: 30,
        instructions: [
          'Start in high plank position',
          'Tap right shoulder with left hand',
          'Tap left shoulder with right hand',
          'Keep hips stable',
          'Continue alternating'
        ],
        tips: [
          'Keep hips from rocking',
          'Maintain plank form',
          'Control movement',
          'Engage core'
        ]
      }
    ]
  },

  // 4. HIIT Fat Burner (30 Minutes)
  {
    id: 'hc4',
    title: 'HIIT Fat Burner',
    objective: 'Maximum calorie burn in minimum time',
    duration: 30,
    category: 'HIIT',
    difficulty: 'Advanced',
    equipment: ['None'],
    icon: 'fire',
    color: 'red',
    exercises: [
      {
        name: 'Jump Squats',
        sets: 5,
        reps: '40 sec',
        duration: 40,
        rest: 20,
        instructions: [
          'Stand with feet shoulder-width',
          'Lower into squat position',
          'Explosively jump upward',
          'Land softly and immediately repeat',
          'Use arm swing for momentum'
        ],
        tips: [
          'Explosive movements',
          'Controlled landings',
          'Use arms for momentum',
          'Breathe rhythmically'
        ]
      },
      {
        name: 'Mountain Climbers',
        sets: 5,
        reps: '40 sec',
        duration: 40,
        rest: 20,
        instructions: [
          'Start in high plank position',
          'Drive right knee toward chest',
          'Quickly switch to left knee',
          'Keep core engaged throughout',
          'Maintain rapid pace'
        ],
        tips: [
          'Keep hips stable',
          'Rapid pace',
          'Full knee drive',
          'Control breathing'
        ]
      },
      {
        name: 'Burpees',
        sets: 5,
        reps: '40 sec',
        duration: 40,
        rest: 20,
        instructions: [
          'Start standing',
          'Drop to squat with hands on ground',
          'Kick feet back to plank',
          'Perform push-up',
          'Jump feet back to squat',
          'Explosively jump upward'
        ],
        tips: [
          'Explosive movements',
          'Controlled landings',
          'Smooth transitions',
          'Maintain form'
        ]
      }
    ]
  },

  // 5. Mobility + Flexibility Flow (30 Minutes)
  {
    id: 'hc5',
    title: 'Mobility + Flexibility Flow',
    objective: 'Improve joint mobility and muscle flexibility',
    duration: 30,
    category: 'Mobility',
    difficulty: 'Beginner',
    equipment: ['None', 'Mat'],
    icon: 'mobility',
    color: 'green',
    exercises: [
      {
        name: 'Cat-Cow',
        sets: 1,
        reps: '2 min',
        duration: 120,
        rest: 0,
        instructions: [
          'Start on hands and knees',
          'Arch back and look up (Cow)',
          'Round back and tuck chin (Cat)',
          'Flow smoothly between positions',
          'Coordinate with breathing'
        ],
        tips: [
          'Slow, controlled breathing',
          'Follow natural spine movement',
          'Don\'t force extreme positions',
          'Focus on mobility'
        ]
      },
      {
        name: 'Hip Openers',
        sets: 1,
        reps: '3 min',
        duration: 180,
        rest: 0,
        instructions: [
          'Sit on floor with knees bent',
          'Let soles of feet touch',
          'Gently press knees outward',
          'Hold stretch',
          'Breathe deeply'
        ],
        tips: [
          'Gentle pressure',
          'Relax into stretch',
          'Don\'t bounce',
          'Hold comfortable position'
        ]
      },
      {
        name: 'Hamstring Stretch',
        sets: 3,
        reps: '30 sec',
        duration: 30,
        rest: 15,
        instructions: [
          'Sit with one leg extended',
          'Other leg bent with foot against inner thigh',
          'Hinge at hips reaching for extended foot',
          'Hold stretch without bouncing',
          'Switch legs'
        ],
        tips: [
          'Keep back straight',
          'Bend knee if needed',
          'Breathe into stretch',
          'Don\'t overstretch'
        ]
      },
      {
        name: 'Shoulder Rotations',
        sets: 3,
        reps: '15',
        duration: 30,
        rest: 15,
        instructions: [
          'Stand or sit with arms extended',
          'Rotate arms in circles',
          'Start with small circles',
          'Gradually increase range',
          'Reverse direction'
        ],
        tips: [
          'Controlled movements',
          'Both directions',
          'Relax shoulders',
          'Gradual progression'
        ]
      }
    ]
  },

  // 6. Deep Core Activation (Inner Unit)
  {
    id: 'hc6',
    title: 'Deep Core Activation',
    objective: 'Strengthen deep core stabilizers',
    duration: 25,
    category: 'Core',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'deep-core',
    color: 'indigo',
    exercises: [
      {
        name: 'Vacuum Hold',
        sets: 5,
        reps: '20 sec',
        duration: 20,
        rest: 15,
        instructions: [
          'Stand or kneel with hands on hips',
          'Exhale completely',
          'Pull navel toward spine',
          'Create hollow in abdomen',
          'Hold without breathing'
        ],
        tips: [
          'Pull navel inward',
          'No spine movement',
          'Start with shorter holds',
          'Progress gradually'
        ]
      },
      {
        name: 'Bird Dog',
        sets: 3,
        reps: '12',
        duration: 30,
        rest: 15,
        instructions: [
          'Start on hands and knees',
          'Extend opposite arm and leg',
          'Keep back flat',
          'Hold position briefly',
          'Return to start and switch sides'
        ],
        tips: [
          'Keep back flat',
          'Control movement',
          'Engage core',
          'Balance on all fours'
        ]
      },
      {
        name: 'Pelvic Tilt',
        sets: 3,
        reps: '15',
        duration: 25,
        rest: 15,
        instructions: [
          'Lie on back with knees bent',
          'Feet flat on floor',
          'Tilt pelvis upward',
          'Return to neutral position',
          'Continue controlled movement'
        ],
        tips: [
          'Controlled movement',
          'Use lower abs',
          'Keep upper body relaxed',
          'Smooth rhythm'
        ]
      }
    ]
  },

  // 7. Posture Correction Routine
  {
    id: 'hc7',
    title: 'Posture Correction Routine',
    objective: 'Improve posture and reduce pain',
    duration: 20,
    category: 'Posture',
    difficulty: 'Beginner',
    equipment: ['None', 'Wall'],
    icon: 'posture',
    color: 'teal',
    exercises: [
      {
        name: 'Wall Angels',
        sets: 3,
        reps: '12',
        duration: 30,
        rest: 15,
        instructions: [
          'Stand with back against wall',
          'Feet 6 inches from wall',
          'Arms in 90-degree position',
          'Slide arms up and down',
          'Keep contact with wall'
        ],
        tips: [
          'Keep back flat against wall',
          'Control movement',
          'Focus on shoulder blades',
          'Breathe naturally'
        ]
      },
      {
        name: 'Chin Tucks',
        sets: 3,
        reps: '15',
        duration: 20,
        rest: 15,
        instructions: [
          'Stand or sit tall',
          'Gently tuck chin toward chest',
          'Hold position briefly',
          'Release slowly',
          'Repeat movement'
        ],
        tips: [
          'Gentle movement',
          'Don\'t force',
          'Focus on neck alignment',
          'Relax shoulders'
        ]
      },
      {
        name: 'Back Extensions',
        sets: 3,
        reps: '12',
        duration: 25,
        rest: 15,
        instructions: [
          'Lie face down with hands behind head',
          'Lift chest off ground',
          'Keep hips on ground',
          'Lower with control',
          'Avoid hyperextension'
        ],
        tips: [
          'Control movement',
          'Use back muscles',
          'Avoid neck strain',
          'Full range of motion'
        ]
      }
    ]
  },

  // 8. Cardio Endurance Builder (45 min)
  {
    id: 'hc8',
    title: 'Cardio Endurance Builder',
    objective: 'Build cardiovascular stamina',
    duration: 45,
    category: 'Cardio',
    difficulty: 'Intermediate',
    equipment: ['None', 'Treadmill'],
    icon: 'cardio',
    color: 'pink',
    exercises: [
      {
        name: 'Jog',
        sets: 1,
        reps: '10 min',
        duration: 600,
        rest: 0,
        instructions: [
          'Start with 5-minute warm-up walk',
          'Progress to comfortable jogging pace',
          'Maintain steady rhythm',
          'Focus on breathing',
          'Cool down with 5-minute walk'
        ],
        tips: [
          'Maintain conversational pace',
          'Proper footwear essential',
          'Good posture',
          'Stay hydrated'
        ]
      },
      {
        name: 'Fast Walk',
        sets: 1,
        reps: '5 min',
        duration: 300,
        rest: 0,
        instructions: [
          'Walk at brisk pace',
          'Swing arms naturally',
          'Maintain upright posture',
          'Focus on breathing rhythm',
          'Land heel to toe'
        ],
        tips: [
          'Heart rate elevated but conversational',
          'Proper arm swing',
          'Good posture',
          'Comfortable shoes'
        ]
      },
      {
        name: 'Sprint',
        sets: 8,
        reps: '30 sec',
        duration: 30,
        rest: 90,
        instructions: [
          'Start with proper warm-up',
          'Run at maximum effort',
          'Maintain proper form',
          'Focus on powerful arm drive',
          'Recover fully between sprints'
        ],
        tips: [
          'Proper warmup essential',
          'Focus on form',
          'Adequate rest between sprints',
          'Stay hydrated'
        ]
      }
    ]
  },

  // 9. Full Body Strength Circuit
  {
    id: 'hc9',
    title: 'Full Body Strength Circuit',
    objective: 'Complete body strength training',
    duration: 35,
    category: 'Full Body',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'full-body',
    color: 'amber',
    exercises: [
      {
        name: 'Squats',
        sets: 5,
        reps: '15',
        duration: 45,
        rest: 30,
        instructions: [
          'Stand feet shoulder-width apart',
          'Lower hips back and down',
          'Keep chest up and back straight',
          'Thighs parallel to ground',
          'Drive through heels to stand'
        ],
        tips: [
          'Control movement',
          'Full range of motion',
          'Keep knees aligned with feet',
          'Engage core'
        ]
      },
      {
        name: 'Push-ups',
        sets: 5,
        reps: '10',
        duration: 30,
        rest: 30,
        instructions: [
          'Start in high plank position',
          'Lower body until chest near ground',
          'Push back up to start',
          'Maintain straight line',
          'Control movement'
        ],
        tips: [
          'Keep core engaged',
          'Full range of motion',
          'Control movement',
          'Breathe steadily'
        ]
      },
      {
        name: 'Plank',
        sets: 5,
        reps: '45 sec',
        duration: 45,
        rest: 30,
        instructions: [
          'Support on forearms and toes',
          'Keep body in straight line',
          'Engage core muscles',
          'Hold position steadily',
          'Breathe naturally'
        ],
        tips: [
          'Don\'t let hips sag',
          'Keep neck neutral',
          'Engage entire core',
          'Start with shorter holds'
        ]
      }
    ]
  },

  // 10. Glute Activation Burn
  {
    id: 'hc10',
    title: 'Glute Activation Burn',
    objective: 'Activate and strengthen glute muscles',
    duration: 25,
    category: 'Lower Body',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'glutes',
    color: 'rose',
    exercises: [
      {
        name: 'Donkey Kicks',
        sets: 3,
        reps: '20',
        duration: 30,
        rest: 20,
        instructions: [
          'Start on all fours',
          'Kick one leg back and up',
          'Keep core engaged',
          'Control movement',
          'Switch legs and repeat'
        ],
        tips: [
          'Control movement',
          'Squeeze glutes',
          'Avoid arching back',
          'Full range of motion'
        ]
      },
      {
        name: 'Fire Hydrants',
        sets: 3,
        reps: '15',
        duration: 25,
        rest: 20,
        instructions: [
          'Start on all fours',
          'Lift knee out to side like dog marking',
          'Keep 90-degree angle at hip',
          'Control movement',
          'Switch sides and repeat'
        ],
        tips: [
          'Control movement',
          'Keep hips stable',
          'Squeeze glutes',
          'Don\'t rotate back'
        ]
      },
      {
        name: 'Hip Thrusts',
        sets: 3,
        reps: '20',
        duration: 30,
        rest: 20,
        instructions: [
          'Lie on back with knees bent',
          'Feet flat on floor',
          'Drive hips upward',
          'Squeeze glutes at top',
          'Lower with control'
        ],
        tips: [
          'Push through heels',
          'Squeeze glutes',
          'Avoid overextending back',
          'Control movement'
        ]
      }
    ]
  },

  // 11. Arm Toning Challenge
  {
    id: 'hc11',
    title: 'Arm Toning Challenge',
    objective: 'Sculpt and tone arm muscles',
    duration: 20,
    category: 'Upper Body',
    difficulty: 'Beginner',
    equipment: ['Dumbbells', 'Resistance Bands'],
    icon: 'arms',
    color: 'cyan',
    exercises: [
      {
        name: 'Bicep Curls',
        sets: 3,
        reps: '12',
        duration: 30,
        rest: 30,
        instructions: [
          'Stand with dumbbells in hands',
          'Palms facing forward',
          'Curl weights toward shoulders',
          'Squeeze biceps at top',
          'Lower with control'
        ],
        tips: [
          'Control movement',
          'Full range of motion',
          'Don\'t use momentum',
          'Squeeze at contraction'
        ]
      },
      {
        name: 'Tricep Kickbacks',
        sets: 3,
        reps: '12',
        duration: 25,
        rest: 30,
        instructions: [
          'Stand with dumbbell in one hand',
          'Hinge at hips slightly',
          'Extend arm back behind body',
          'Squeeze triceps at extension',
          'Return with control'
        ],
        tips: [
          'Keep upper arm still',
          'Control movement',
          'Full extension',
          'Squeeze triceps'
        ]
      },
      {
        name: 'Push-ups',
        sets: 3,
        reps: '10',
        duration: 30,
        rest: 30,
        instructions: [
          'Start in high plank position',
          'Lower body until chest near ground',
          'Push back up to start',
          'Maintain straight line',
          'Control movement'
        ],
        tips: [
          'Keep core engaged',
          'Full range of motion',
          'Control movement',
          'Breathe steadily'
        ]
      }
    ]
  },

  // 12. Abs + Oblique Killer
  {
    id: 'hc12',
    title: 'Abs + Oblique Killer',
    objective: 'Intense abdominal and oblique workout',
    duration: 30,
    category: 'Core',
    difficulty: 'Advanced',
    equipment: ['None'],
    icon: 'abs',
    color: 'lime',
    exercises: [
      {
        name: 'Side Plank',
        sets: 3,
        reps: '30 sec',
        duration: 30,
        rest: 20,
        instructions: [
          'Lie on side with forearm support',
          'Stack feet or stagger',
          'Lift hips creating straight line',
          'Engage core and obliques',
          'Hold position steadily'
        ],
        tips: [
          'Keep hips lifted',
          'Don\'t let hips sag',
          'Breathe steadily',
          'Engage side muscles'
        ]
      },
      {
        name: 'Russian Twists',
        sets: 3,
        reps: '25',
        duration: 40,
        rest: 20,
        instructions: [
          'Sit with knees bent and feet elevated',
          'Lean back slightly',
          'Rotate torso side to side',
          'Touch hands beside body',
          'Control movement'
        ],
        tips: [
          'Keep chest lifted',
          'Control rotation',
          'Use obliques',
          'Avoid using momentum'
        ]
      },
      {
        name: 'Heel Touches',
        sets: 3,
        reps: '30',
        duration: 35,
        rest: 20,
        instructions: [
          'Lie on back with legs extended',
          'Reach right hand toward left heel',
          'Lift shoulders off ground',
          'Switch sides and repeat',
          'Control movement'
        ],
        tips: [
          'Keep legs straight',
          'Control movement',
          'Exhale as you reach',
          'Don\'t pull neck'
        ]
      }
    ]
  },

  // 13. Explosive Power Workout
  {
    id: 'hc13',
    title: 'Explosive Power Workout',
    objective: 'Develop explosive strength and power',
    duration: 30,
    category: 'Power',
    difficulty: 'Advanced',
    equipment: ['Box', 'None'],
    icon: 'power',
    color: 'red',
    exercises: [
      {
        name: 'Box Jumps',
        sets: 3,
        reps: '10',
        duration: 30,
        rest: 45,
        instructions: [
          'Stand in front of sturdy box',
          'Lower into quarter squat',
          'Explosively jump onto box',
          'Land softly with bent knees',
          'Step down and repeat'
        ],
        tips: [
          'Explosive hip drive',
          'Soft landings',
          'Start with low box',
          'Control movement',
          'Progress gradually'
        ]
      },
      {
        name: 'Broad Jumps',
        sets: 3,
        reps: '8',
        duration: 25,
        rest: 45,
        instructions: [
          'Stand with feet shoulder-width',
          'Lower into squat position',
          'Jump forward as far as possible',
          'Land softly on both feet',
          'Stick landing and hold'
        ],
        tips: [
          'Explosive power',
          'Soft landings',
          'Good landing mechanics',
          'Arm drive for momentum'
        ]
      },
      {
        name: 'Sprint',
        sets: 6,
        reps: '30 sec',
        duration: 30,
        rest: 90,
        instructions: [
          'Start with proper warm-up',
          'Run at maximum effort',
          'Maintain proper sprint form',
          'Focus on powerful leg drive',
          'Recover fully between sprints'
        ],
        tips: [
          'Proper warmup essential',
          'Focus on form',
          'Adequate rest between sprints',
          'Stay hydrated'
        ]
      }
    ]
  },

  // 14. Balance & Stability Training
  {
    id: 'hc14',
    title: 'Balance & Stability Training',
    objective: 'Improve balance and stability',
    duration: 25,
    category: 'Balance',
    difficulty: 'Intermediate',
    equipment: ['Bosu Ball', 'None'],
    icon: 'balance',
    color: 'purple',
    exercises: [
      {
        name: 'Single-leg Stand',
        sets: 3,
        reps: '45 sec',
        duration: 45,
        rest: 20,
        instructions: [
          'Stand on one leg',
          'Keep supporting knee slightly bent',
          'Maintain upright posture',
          'Focus on fixed point',
          'Hold position steadily'
        ],
        tips: [
          'Choose focal point',
          'Engage core',
          'Start near support',
          'Progress duration gradually'
        ]
      },
      {
        name: 'Bosu Squats',
        sets: 3,
        reps: '12',
        duration: 35,
        rest: 25,
        instructions: [
          'Stand on Bosu ball dome side',
          'Lower into squat position',
          'Control balance throughout',
          'Drive through heels to stand',
          'Maintain upright posture'
        ],
        tips: [
          'Start with shallow squats',
          'Use arms for balance',
          'Control movement',
          'Focus on stability'
        ]
      },
      {
        name: 'Bird Dog',
        sets: 3,
        reps: '10',
        duration: 30,
        rest: 20,
        instructions: [
          'Start on hands and knees',
          'Extend opposite arm and leg',
          'Keep back flat',
          'Hold position briefly',
          'Return to start and switch sides'
        ],
        tips: [
          'Keep back flat',
          'Control movement',
          'Engage core',
          'Balance on all fours'
        ]
      }
    ]
  },

  // 15. Fat Loss Circuit
  {
    id: 'hc15',
    title: 'Fat Loss Circuit',
    objective: 'Maximum calorie burn and fat loss',
    duration: 35,
    category: 'Fat Loss',
    difficulty: 'Advanced',
    equipment: ['Jump Rope', 'None'],
    icon: 'fat-loss',
    color: 'orange',
    exercises: [
      {
        name: 'Skipping',
        sets: 1,
        reps: '5 min',
        duration: 300,
        rest: 0,
        instructions: [
          'Hold jump rope handles',
          'Jump over rope with both feet',
          'Maintain steady rhythm',
          'Keep elbows close to body',
          'Use wrists not arms'
        ],
        tips: [
          'Start slow',
          'Keep elbows close',
          'Use wrists not arms',
          'Maintain rhythm'
        ]
      },
      {
        name: 'Burpees',
        sets: 3,
        reps: '12',
        duration: 40,
        rest: 30,
        instructions: [
          'Start standing',
          'Drop to squat with hands on ground',
          'Kick feet back to plank',
          'Perform push-up',
          'Jump feet back to squat',
          'Explosively jump upward'
        ],
        tips: [
          'Explosive movements',
          'Controlled landings',
          'Smooth transitions',
          'Maintain form'
        ]
      },
      {
        name: 'Jump Lunges',
        sets: 3,
        reps: '15',
        duration: 35,
        rest: 25,
        instructions: [
          'Step forward into lunge',
          'Explosively jump upward',
          'Switch legs in air',
          'Land in lunge position',
          'Continue alternating'
        ],
        tips: [
          'Explosive power',
          'Soft landings',
          'Control movement',
          'Good rhythm'
        ]
      }
    ]
  },

  // 16. Yoga Flow (Recovery Day)
  {
    id: 'hc16',
    title: 'Yoga Flow',
    objective: 'Recovery and flexibility',
    duration: 30,
    category: 'Yoga',
    difficulty: 'Beginner',
    equipment: ['None', 'Mat'],
    icon: 'yoga',
    color: 'green',
    exercises: [
      {
        name: 'Sun Salutation',
        sets: 5,
        reps: 'rounds',
        duration: 60,
        rest: 15,
        instructions: [
          'Stand at front of mat',
          'Inhale arms overhead',
          'Exhale fold forward',
          'Step back to plank',
          'Lower through push-up',
          'Cobra pose upward',
          'Return to plank and step forward',
          'Complete sequence with mountain pose'
        ],
        tips: [
          'Coordinate with breathing',
          'Smooth transitions',
          'Mindful movement',
          'Don\'t rush poses'
        ]
      },
      {
        name: 'Cobra',
        sets: 1,
        reps: '30 sec',
        duration: 30,
        rest: 15,
        instructions: [
          'Lie face down on mat',
          'Hands under shoulders',
          'Gently lift chest off ground',
          'Keep hips on mat',
          'Look forward slightly',
          'Breathe deeply'
        ],
        tips: [
          'Gentle backbend',
          'Use back muscles',
          'Don\'t force',
          'Breathe into stretch'
        ]
      },
      {
        name: 'Child Pose',
        sets: 1,
        reps: '2 min',
        duration: 120,
        rest: 0,
        instructions: [
          'Kneel on mat',
          'Sit back on heels',
          'Fold forward over legs',
          'Extend arms forward or rest alongside',
          'Rest forehead on mat',
          'Relax completely'
        ],
        tips: [
          'Breathe deeply',
          'Let go completely',
          'Forehead on ground',
          'Total relaxation'
        ]
      }
    ]
  },

  // 17. Back Strength Builder
  {
    id: 'hc17',
    title: 'Back Strength Builder',
    objective: 'Strengthen back muscles and improve posture',
    duration: 30,
    category: 'Back',
    difficulty: 'Intermediate',
    equipment: ['Dumbbells', 'None'],
    icon: 'back',
    color: 'blue',
    exercises: [
      {
        name: 'Superman',
        sets: 3,
        reps: '15',
        duration: 30,
        rest: 20,
        instructions: [
          'Lie face down with arms extended',
          'Lift chest and arms off ground',
          'Keep legs on ground',
          'Squeeze back muscles',
          'Lower with control'
        ],
        tips: [
          'Control movement',
          'Squeeze back muscles',
          'Don\'t overextend',
          'Keep neck neutral'
        ]
      },
      {
        name: 'Reverse Fly',
        sets: 3,
        reps: '12',
        duration: 30,
        rest: 20,
        instructions: [
          'Hold dumbbells with palms facing',
          'Bend at hips slightly',
          'Open arms out to sides',
          'Squeeze shoulder blades',
          'Control movement back to start'
        ],
        tips: [
          'Control movement',
          'Squeeze shoulder blades',
          'Don\'t use momentum',
          'Full range of motion'
        ]
      },
      {
        name: 'Rows',
        sets: 3,
        reps: '12',
        duration: 35,
        rest: 20,
        instructions: [
          'Bend at hips with back straight',
          'Pull dumbbells toward lower chest',
          'Squeeze back muscles',
          'Control movement down',
          'Keep core engaged'
        ],
        tips: [
          'Keep back straight',
          'Squeeze back muscles',
          'Control movement',
          'Don\'t use momentum'
        ]
      }
    ]
  },

  // 18. Core Stability Advanced
  {
    id: 'hc18',
    title: 'Core Stability Advanced',
    objective: 'Advanced core strengthening and stability',
    duration: 25,
    category: 'Core',
    difficulty: 'Expert',
    equipment: ['Pull-up Bar', 'None'],
    icon: 'core-advanced',
    color: 'red',
    exercises: [
      {
        name: 'Hanging Leg Raises',
        sets: 3,
        reps: '10',
        duration: 40,
        rest: 30,
        instructions: [
          'Hang from pull-up bar',
          'Engage core throughout',
          'Lift legs to 90 degrees',
          'Control movement down',
          'Avoid swinging'
        ],
        tips: [
          'Engage entire core',
          'Control movement',
          'Avoid using momentum',
          'Start with knees bent if needed'
        ]
      },
      {
        name: 'Plank',
        sets: 4,
        reps: '60 sec',
        duration: 60,
        rest: 30,
        instructions: [
          'Support on forearms and toes',
          'Keep body in straight line',
          'Engage all core muscles',
          'Hold position steadily',
          'Breathe naturally'
        ],
        tips: [
          'Don\'t let hips sag',
          'Keep neck neutral',
          'Engage entire core',
          'Progress duration gradually'
        ]
      }
    ]
  },

  // 19. Stair Cardio Challenge
  {
    id: 'hc19',
    title: 'Stair Cardio Challenge',
    objective: 'Cardio conditioning using stairs',
    duration: 30,
    category: 'Cardio',
    difficulty: 'Intermediate',
    equipment: ['Stairs', 'Stair Climber'],
    icon: 'stairs',
    color: 'yellow',
    exercises: [
      {
        name: 'Stair Climb',
        sets: 1,
        reps: '20 min',
        duration: 1200,
        rest: 0,
        instructions: [
          'Use stairs or stair climber',
          'Maintain steady climbing pace',
          'Use handrails if needed',
          'Focus on breathing',
          'Maintain good posture'
        ],
        tips: [
          'Full step each time',
          'Maintain posture',
          'Vary intensity',
          'Stay hydrated'
        ]
      },
      {
        name: 'Sprint Up',
        sets: 10,
        reps: 'rounds',
        duration: 20,
        rest: 40,
        instructions: [
          'Climb stairs quickly',
          'Focus on explosive power',
          'Use arm drive',
          'Control descent',
          'Repeat immediately'
        ],
        tips: [
          'Quick direction changes',
          'Touch lines',
          'Explosive starts',
          'Control movement'
        ]
      }
    ]
  },

  // 20. Functional Fitness Routine
  {
    id: 'hc20',
    title: 'Functional Fitness Routine',
    objective: 'Real-world functional strength',
    duration: 25,
    category: 'Functional',
    difficulty: 'Intermediate',
    equipment: ['Dumbbells', 'Kettlebells', 'None'],
    icon: 'functional',
    color: 'teal',
    exercises: [
      {
        name: 'Farmer Carry',
        sets: 3,
        reps: '40 sec',
        duration: 40,
        rest: 30,
        instructions: [
          'Hold heavy weights in both hands',
          'Stand tall with chest up',
          'Walk forward maintaining posture',
          'Engage core throughout',
          'Control movement'
        ],
        tips: [
          'Maintain upright posture',
          'Engage core',
          'Controlled walking',
          'Don\'t rush'
        ]
      },
      {
        name: 'Squat to Press',
        sets: 3,
        reps: '12',
        duration: 35,
        rest: 30,
        instructions: [
          'Hold weights at shoulders',
          'Perform full squat',
          'Explosively drive up pressing weights overhead',
          'Control movement down',
          'Maintain good form'
        ],
        tips: [
          'Control movement',
          'Full range of motion',
          'Engage core',
          'Don\'t arch back'
        ]
      }
    ]
  },

  // 21. Calisthenics Beginner
  {
    id: 'hc21',
    title: 'Calisthenics Beginner',
    objective: 'Build foundation with bodyweight exercises',
    duration: 30,
    category: 'Calisthenics',
    difficulty: 'Beginner',
    equipment: ['None'],
    icon: 'calisthenics',
    color: 'green',
    exercises: [
      {
        name: 'Incline Push-ups',
        sets: 3,
        reps: '12',
        duration: 35,
        rest: 30,
        instructions: [
          'Find elevated surface (bench, step)',
          'Place hands on elevated surface',
          'Lower chest to surface',
          'Push back up to start',
          'Keep body in straight line'
        ],
        tips: [
          'Start with higher incline',
          'Progress to lower incline',
          'Control movement',
          'Full range of motion'
        ]
      },
      {
        name: 'Assisted Squats',
        sets: 3,
        reps: '15',
        duration: 40,
        rest: 30,
        instructions: [
          'Stand holding support (chair, wall)',
          'Lower into squat using support',
          'Control movement down and up',
          'Use minimal assistance needed',
          'Focus on form'
        ],
        tips: [
          'Use minimal support',
          'Focus on proper form',
          'Progress to unassisted',
          'Control movement'
        ]
      }
    ]
  },

  // 22. Calisthenics Intermediate
  {
    id: 'hc22',
    title: 'Calisthenics Intermediate',
    objective: 'Progressive bodyweight strength training',
    duration: 30,
    category: 'Calisthenics',
    difficulty: 'Intermediate',
    equipment: ['Pull-up Bar', 'Parallel Bars'],
    icon: 'calisthenics-adv',
    color: 'blue',
    exercises: [
      {
        name: 'Pull-ups',
        sets: 3,
        reps: '6',
        duration: 30,
        rest: 45,
        instructions: [
          'Hang from bar with overhand grip',
          'Pull body up until chin over bar',
          'Lower with control',
          'Full range of motion',
          'Engage back muscles'
        ],
        tips: [
          'Engage lats',
          'Avoid swinging',
          'Full range of motion',
          'Control negative'
        ]
      },
      {
        name: 'Dips',
        sets: 3,
        reps: '8',
        duration: 25,
        rest: 45,
        instructions: [
          'Support on parallel bars',
          'Lower body by bending elbows',
          'Push back up to start',
          'Lean forward for chest emphasis',
          'Keep shoulders stable'
        ],
        tips: [
          'Control movement',
          'Full range of motion',
          'Don\'t flare elbows',
          'Use appropriate variation'
        ]
      }
    ]
  },

  // 23. Sprint Intervals
  {
    id: 'hc23',
    title: 'Sprint Intervals',
    objective: 'High-intensity interval training',
    duration: 30,
    category: 'HIIT',
    difficulty: 'Advanced',
    equipment: ['None', 'Treadmill'],
    icon: 'sprint',
    color: 'red',
    exercises: [
      {
        name: 'Sprint Intervals',
        sets: 10,
        reps: '30 sec sprint + 1 min walk',
        duration: 90,
        rest: 0,
        instructions: [
          '30 second maximum effort sprint',
          '1 minute active recovery walk',
          'Repeat cycle',
          'Maintain proper sprint form',
          'Focus on breathing during recovery'
        ],
        tips: [
          'Maximum effort during sprints',
          'Active recovery not complete rest',
          'Consistent pacing',
          'Proper warmup and cooldown'
        ]
      }
    ]
  },

  // 24. Active Recovery Walk
  {
    id: 'hc24',
    title: 'Active Recovery Walk',
    objective: 'Light recovery and blood flow',
    duration: 45,
    category: 'Recovery',
    difficulty: 'Beginner',
    equipment: ['None'],
    icon: 'recovery',
    color: 'green',
    exercises: [
      {
        name: 'Brisk Walk',
        sets: 1,
        reps: '45 min',
        duration: 2700,
        rest: 0,
        instructions: [
          'Walk at brisk, comfortable pace',
          'Swing arms naturally',
          'Maintain good posture',
          'Focus on breathing rhythm',
          'Enjoy the movement'
        ],
        tips: [
          'Comfortable but challenging pace',
          'Good posture',
          'Natural arm swing',
          'Stay hydrated'
        ]
      }
    ]
  },

  // 25. Core + Cardio Combo
  {
    id: 'hc25',
    title: 'Core + Cardio Combo',
    objective: 'Combine core strengthening with cardio',
    duration: 30,
    category: 'Hybrid',
    difficulty: 'Intermediate',
    equipment: ['Jump Rope', 'None'],
    icon: 'hybrid',
    color: 'purple',
    exercises: [
      {
        name: 'Plank',
        sets: 10,
        reps: '45 sec',
        duration: 45,
        rest: 15,
        instructions: [
          'Support on forearms and toes',
          'Keep body in straight line',
          'Engage core muscles',
          'Hold position steadily',
          'Breathe naturally'
        ],
        tips: [
          'Don\'t let hips sag',
          'Keep neck neutral',
          'Engage entire core',
          'Transition quickly to jump rope'
        ]
      },
      {
        name: 'Jump Rope',
        sets: 10,
        reps: '1 min',
        duration: 60,
        rest: 0,
        instructions: [
          'Hold jump rope handles',
          'Jump over rope with both feet',
          'Maintain steady rhythm',
          'Keep elbows close to body',
          'Use wrists not arms'
        ],
        tips: [
          'Start slow',
          'Keep elbows close',
          'Use wrists not arms',
          'Maintain rhythm'
        ]
      }
    ]
  },

  // 26. Lower Body Burnout
  {
    id: 'hc26',
    title: 'Lower Body Burnout',
    objective: 'Maximum lower body muscle fatigue',
    duration: 25,
    category: 'Lower Body',
    difficulty: 'Advanced',
    equipment: ['None'],
    icon: 'burnout',
    color: 'red',
    exercises: [
      {
        name: 'Squats',
        sets: 1,
        reps: '50',
        duration: 90,
        rest: 60,
        instructions: [
          'Perform 50 consecutive squats',
          'Maintain proper form throughout',
          'Focus on muscle contraction',
          'Push through challenging reps',
          'Complete all reps if possible'
        ],
        tips: [
          'Maintain form despite fatigue',
          'Break into smaller sets if needed',
          'Stay hydrated',
          'Listen to your body'
        ]
      },
      {
        name: 'Lunges',
        sets: 1,
        reps: '40',
        duration: 80,
        rest: 60,
        instructions: [
          'Perform 40 consecutive lunges',
          '20 reps per leg',
          'Maintain proper form',
          'Control movement',
          'Push through fatigue',
          'Complete all reps'
        ],
        tips: [
          'Maintain form',
          'Control movement',
          'Break into sets if needed',
          'Stay hydrated'
        ]
      }
    ]
  },

  // 27. Shoulder Strength
  {
    id: 'hc27',
    title: 'Shoulder Strength',
    objective: 'Build strong, stable shoulders',
    duration: 25,
    category: 'Upper Body',
    difficulty: 'Intermediate',
    equipment: ['Dumbbells', 'Resistance Bands'],
    icon: 'shoulders',
    color: 'blue',
    exercises: [
      {
        name: 'Overhead Press',
        sets: 3,
        reps: '12',
        duration: 35,
        rest: 30,
        instructions: [
          'Hold weights at shoulder height',
          'Press weights overhead',
          'Keep core engaged',
          'Control movement down',
          'Don\'t arch back'
        ],
        tips: [
          'Control movement',
          'Full range of motion',
          'Engage core',
          'Don\'t lock elbows'
        ]
      },
      {
        name: 'Lateral Raises',
        sets: 3,
        reps: '15',
        duration: 25,
        rest: 30,
        instructions: [
          'Hold weights at sides',
          'Raise arms to shoulder height',
          'Keep slight bend in elbows',
          'Control movement down',
          'Maintain posture'
        ],
        tips: [
          'Control movement',
          'Don\'t use momentum',
          'Shoulder blades down',
          'Light weights for higher reps'
        ]
      }
    ]
  },

  // 28. Plyometric Blast
  {
    id: 'hc28',
    title: 'Plyometric Blast',
    objective: 'Explosive power development',
    duration: 25,
    category: 'Plyometric',
    difficulty: 'Expert',
    equipment: ['None', 'Box'],
    icon: 'plyometric',
    color: 'orange',
    exercises: [
      {
        name: 'Jump Squats',
        sets: 3,
        reps: '15',
        duration: 40,
        rest: 45,
        instructions: [
          'Lower into squat position',
          'Explosively jump upward',
          'Land softly and immediately repeat',
          'Use arm swing for momentum',
          'Focus on power output'
        ],
        tips: [
          'Explosive hip drive',
          'Soft landings',
          'Quick ground contact time',
          'Progress gradually'
        ]
      },
      {
        name: 'Skater Jumps',
        sets: 3,
        reps: '20',
        duration: 35,
        rest: 30,
        instructions: [
          'Jump sideways onto one leg',
          'Swing other leg behind',
          'Immediately jump to other side',
          'Maintain balance',
          'Control movement'
        ],
        tips: [
          'Explosive movements',
          'Soft landings',
          'Good balance',
          'Control movement'
        ]
      }
    ]
  },

  // 29. Flexibility Deep Stretch
  {
    id: 'hc29',
    title: 'Flexibility Deep Stretch',
    objective: 'Comprehensive full-body flexibility',
    duration: 30,
    category: 'Flexibility',
    difficulty: 'Beginner',
    equipment: ['None', 'Mat'],
    icon: 'flexibility',
    color: 'pink',
    exercises: [
      {
        name: 'Full Body Stretch',
        sets: 1,
        reps: '30 min',
        duration: 1800,
        rest: 0,
        instructions: [
          'Perform systematic full-body stretch routine',
          'Hold each stretch 15-30 seconds',
          'Focus on major muscle groups',
          'Breathe deeply throughout',
          'Progress gently'
        ],
        tips: [
          'Don\'t bounce',
          'Hold comfortable positions',
          'Breathe into stretches',
          'Progress gradually',
          'Listen to your body'
        ]
      }
    ]
  },

  // 30. Endurance Challenge
  {
    id: 'hc30',
    title: 'Endurance Challenge',
    objective: 'Build sustained exercise capacity',
    duration: 60,
    category: 'Endurance',
    difficulty: 'Advanced',
    equipment: ['None'],
    icon: 'endurance',
    color: 'dark-blue',
    exercises: [
      {
        name: 'Continuous Workout',
        sets: 1,
        reps: '60 min',
        duration: 3600,
        rest: 0,
        instructions: [
          'Perform 60 minutes of continuous exercise',
          'Low to moderate intensity throughout',
          'Mix different exercise types',
          'Maintain steady pace',
          'Focus on consistency'
        ],
        tips: [
          'Pace yourself',
          'Stay hydrated',
          'Mix exercise types',
          'Maintain good form',
          'Listen to your body'
        ]
      }
    ]
  },

  // 31. Core + Posture Combo
  {
    id: 'hc31',
    title: 'Core + Posture Combo',
    objective: 'Core strength with posture improvement',
    duration: 25,
    category: 'Hybrid',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'core-posture',
    color: 'teal',
    exercises: [
      {
        name: 'Vacuum + Plank Combo',
        sets: 5,
        reps: '20 sec vacuum + 30 sec plank',
        duration: 50,
        rest: 20,
        instructions: [
          'Perform vacuum hold for 20 seconds',
          'Immediately transition to plank',
          'Hold plank for 30 seconds',
          'Rest and repeat',
          'Focus on core engagement',
          'Control breathing'
        ],
        tips: [
          'Smooth transitions',
          'Maintain core tension',
          'Control breathing',
          'Focus on form'
        ]
      }
    ]
  },

  // 32. Morning Energizer
  {
    id: 'hc32',
    title: 'Morning Energizer',
    objective: 'Start day with energy and vitality',
    duration: 15,
    category: 'Morning',
    difficulty: 'Beginner',
    equipment: ['None'],
    icon: 'morning',
    color: 'yellow',
    exercises: [
      {
        name: 'Jumping Jacks',
        sets: 1,
        reps: '3 min',
        duration: 180,
        rest: 0,
        instructions: [
          'Jump feet apart while raising arms',
          'Jump feet together while lowering arms',
          'Maintain steady rhythm',
          'Keep movements light and energetic',
          'Breathe naturally'
        ],
        tips: [
          'Start slow and increase pace',
          'Land softly',
          'Full range of motion',
          'Stay light on feet'
        ]
      }
    ]
  },

  // 33. Evening Relaxation Routine
  {
    id: 'hc33',
    title: 'Evening Relaxation Routine',
    objective: 'Wind down and prepare for rest',
    duration: 20,
    category: 'Evening',
    difficulty: 'Beginner',
    equipment: ['None', 'Mat'],
    icon: 'evening',
    color: 'indigo',
    exercises: [
      {
        name: 'Yoga + Breathing',
        sets: 1,
        reps: '20 min',
        duration: 1200,
        rest: 0,
        instructions: [
          'Perform gentle yoga poses',
          'Focus on deep breathing',
          'Hold poses 30-60 seconds',
          'Flow smoothly between poses',
          'End with relaxation'
        ],
        tips: [
          'Gentle movements only',
          'Focus on breathing',
          'Let go of tension',
          'Create calming environment'
        ]
      }
    ]
  },

  // 34. Fat Burn Ladder
  {
    id: 'hc34',
    title: 'Fat Burn Ladder',
    objective: 'Progressive intensity fat burning',
    duration: 25,
    category: 'HIIT',
    difficulty: 'Advanced',
    equipment: ['None'],
    icon: 'ladder',
    color: 'red',
    exercises: [
      {
        name: '10–1 Reps Descending',
        sets: 1,
        reps: '10-9-8-7-6-5-4-3-2-1',
        duration: 300,
        rest: 0,
        instructions: [
          'Start with 10 reps of exercise',
          'Rest 10 seconds',
          'Perform 9 reps',
          'Continue decreasing by 1 rep',
          'Finish with 1 rep',
          'Focus on form throughout'
        ],
        tips: [
          'Maintain form despite fatigue',
          'Control breathing',
          'Push through challenging sets',
          'Stay hydrated'
        ]
      }
    ]
  },

  // 35. Strength Pyramid
  {
    id: 'hc35',
    title: 'Strength Pyramid',
    objective: 'Progressive strength building',
    duration: 30,
    category: 'Strength',
    difficulty: 'Intermediate',
    equipment: ['Dumbbells', 'None'],
    icon: 'pyramid',
    color: 'purple',
    exercises: [
      {
        name: 'Increasing Reps Each Set',
        sets: 5,
        reps: '8-10-12-15-12-10',
        duration: 40,
        rest: 30,
        instructions: [
          'Start with 8 reps',
          'Rest and increase to 10',
          'Continue increasing reps',
          'Peak at 15 reps',
          'Decrease back down',
          'Maintain good form'
        ],
        tips: [
          'Control movement',
          'Focus on form',
          'Progressive overload',
          'Adequate rest periods'
        ]
      }
    ]
  },

  // 36. No Equipment Full Body
  {
    id: 'hc36',
    title: 'No Equipment Full Body',
    objective: 'Complete workout without equipment',
    duration: 30,
    category: 'Bodyweight',
    difficulty: 'Intermediate',
    equipment: ['None'],
    icon: 'no-equipment',
    color: 'green',
    exercises: [
      {
        name: 'Squats, Push-ups, Planks',
        sets: 3,
        reps: '15-10-45 sec',
        duration: 90,
        rest: 30,
        instructions: [
          'Perform 15 squats',
          'Rest 30 seconds',
          'Perform 10 push-ups',
          'Rest 30 seconds',
          'Hold 45-second plank',
          'Repeat circuit 3 times'
        ],
        tips: [
          'Maintain good form',
          'Control breathing',
          'Stay hydrated',
          'Push through fatigue'
        ]
      }
    ]
  },

  // 37. Resistance Band Workout
  {
    id: 'hc37',
    title: 'Resistance Band Workout',
    objective: 'Versatile strength training with bands',
    duration: 30,
    category: 'Resistance Band',
    difficulty: 'Intermediate',
    equipment: ['Resistance Bands'],
    icon: 'resistance-bands',
    color: 'orange',
    exercises: [
      {
        name: 'Rows, Curls, Presses',
        sets: 3,
        reps: '12',
        duration: 35,
        rest: 30,
        instructions: [
          'Perform band rows for back',
          'Band curls for biceps',
          'Band presses for chest/shoulders',
          'Control movement throughout',
          'Focus on muscle contraction',
          'Maintain tension on bands'
        ],
        tips: [
          'Control movement',
          'Full range of motion',
          'Maintain band tension',
          'Progress band resistance',
          'Focus on target muscles'
        ]
      }
    ]
  },

  // 38. Core Endurance Hold
  {
    id: 'hc38',
    title: 'Core Endurance Hold',
    objective: 'Maximum core endurance challenge',
    duration: 20,
    category: 'Core',
    difficulty: 'Expert',
    equipment: ['None'],
    icon: 'core-endurance',
    color: 'red',
    exercises: [
      {
        name: 'Plank Hold Challenge',
        sets: 1,
        reps: 'Max time',
        duration: 300,
        rest: 0,
        instructions: [
          'Hold plank position as long as possible',
          'Maintain perfect form',
          'Engage entire core',
          'Breathe naturally',
          'Push through discomfort'
        ],
        tips: [
          'Perfect form over time',
          'Push limits safely',
          'Record time for progression',
          'Stay mentally strong'
        ]
      }
    ]
  },

  // 39. 10K Steps Challenge
  {
    id: 'hc39',
    title: '10K Steps Challenge',
    objective: 'Daily walking goal for cardiovascular health',
    duration: 120, // spread throughout day
    category: 'Walking',
    difficulty: 'Beginner',
    equipment: ['None', 'Fitness Tracker'],
    icon: 'steps',
    color: 'blue',
    exercises: [
      {
        name: 'Walk 10,000 Steps',
        sets: 1,
        reps: '10,000 steps/day',
        duration: 7200,
        rest: 0,
        instructions: [
          'Walk throughout day to reach 10,000 steps',
          'Take stairs when possible',
          'Park further away',
          'Take walking breaks',
          'Use step tracker to monitor'
        ],
        tips: [
          'Spread walking throughout day',
          'Take stairs when possible',
          'Walk during breaks',
          'Comfortable walking shoes',
          'Stay hydrated'
        ]
      }
    ]
  },

  // 40. Weekly Hybrid Challenge
  {
    id: 'hc40',
    title: 'Weekly Hybrid Challenge',
    objective: 'Comprehensive weekly fitness plan',
    duration: 420, // 7 days x 60 min
    category: 'Weekly Plan',
    difficulty: 'Intermediate',
    equipment: ['None', 'Basic Equipment'],
    icon: 'weekly',
    color: 'purple',
    exercises: [
      {
        name: '3 Strength Days + 2 Cardio Days + 1 Mobility Day',
        sets: 7,
        reps: '60 min sessions',
        duration: 3600,
        rest: 0,
        instructions: [
          'Monday: Strength training (upper body)',
          'Tuesday: Cardio (HIIT)',
          'Wednesday: Strength training (lower body)',
          'Thursday: Cardio (steady state)',
          'Friday: Strength training (full body)',
          'Saturday: Cardio (moderate intensity)',
          'Sunday: Mobility and flexibility',
          'Each session 60 minutes',
          'Focus on proper form and progression'
        ],
        tips: [
          'Balance strength and cardio',
          'Include mobility work',
          'Progressive overload',
          'Adequate recovery',
          'Consistency is key'
        ]
      }
    ]
  }
];

export const getRandomChallenges = (count: number = 5): HealthChallenge[] => {
  const shuffled = [...HEALTH_CHALLENGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getChallengeById = (id: string): HealthChallenge | undefined => {
  return HEALTH_CHALLENGES.find(challenge => challenge.id === id);
};

export const getChallengesByCategory = (category: string): HealthChallenge[] => {
  return HEALTH_CHALLENGES.filter(challenge => challenge.category === category);
};

export const getChallengesByDifficulty = (difficulty: string): HealthChallenge[] => {
  return HEALTH_CHALLENGES.filter(challenge => challenge.difficulty === difficulty);
};
