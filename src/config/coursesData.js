/**
 * BrushQuest AI — Course & Step Data Pipeline
 *
 * Defines 3 rich courses with micro-steps, evaluation criteria,
 * CV analysis config, XP rewards, and reference guide data.
 *
 * Quadrant map (matches cvAnalysisEngine):
 *   TL = 0 | TR = 1
 *   BL = 2 | BR = 3
 */

export const COURSES = [
  // ══════════════════════════════════════════════════════════════════════════
  // COURSE 1 — 3D Sphere & Light Mechanics
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'course_sphere',
    title: '3D Sphere & Light Mechanics',
    subtitle: 'Master form, volume, and the physics of light',
    description:
      'Learn to transform a flat circle into a believable three-dimensional sphere by mastering contour drawing, light vector placement, and graduated shadow rendering.',
    icon: '⚪',
    color: 'from-purple-600 to-indigo-600',
    accentColor: '#a855f7',
    xpReward: 150,
    locked: false,
    estimatedMinutes: 12,
    steps: [
      {
        id: 'sphere_step_1',
        stepNumber: 1,
        title: 'Base Contour',
        shortTitle: 'Contour',
        goal: 'Draw a clean oval or circular outline centered on the canvas to define the sphere\'s base form.',
        instruction:
          'Using a thin brush (2–4px), draw a smooth, closed circular or elliptical outline centered on the canvas. Aim for steady, confident strokes. Use the reference guide overlay to align your contour.',
        evaluationCriteria:
          'The outline strokes should be centered on the canvas (center of mass within the middle 40%), form a closed or near-closed loop, and have moderate coverage (2–15% of canvas area).',
        xpReward: 40,
        badgeLabel: 'Contourist',
        badgeIcon: '🔵',
        cvConfig: {
          contentType: 'outline',
          targetQuadrant: null,
          targetQuadrantName: null,
          minCoverage: 0.02,
          maxCoverage: 0.18,
          recommendedNext: 'Value scale exercise — draw a 5-step grey gradient strip',
        },
        referenceGuide: {
          type: 'circle',
          description: 'Draw a centered oval outline — aim for the guide ring',
        },
        tips: [
          'Use your whole arm, not just your wrist, for smoother curves.',
          'Try overlapping multiple C-strokes to build a circular form.',
          'A perfect circle is not required — confident marks matter more.',
        ],
      },
      {
        id: 'sphere_step_2',
        stepNumber: 2,
        title: 'Light Vector Marking',
        shortTitle: 'Light Vector',
        goal: 'Indicate the light source direction by placing radiating marks or an arrow in the top-right quadrant.',
        instruction:
          'Using a contrasting color (yellow or white on dark background), draw short radiating lines or a sun symbol in the top-right corner of the canvas to mark your light source position.',
        evaluationCriteria:
          'Drawn marks should be concentrated primarily in the top-right quadrant (TR) of the canvas. Coverage should be light (1–8%) indicating directional marks rather than filled areas.',
        xpReward: 40,
        badgeLabel: 'Light Tracker',
        badgeIcon: '☀️',
        cvConfig: {
          contentType: 'light_vector',
          targetQuadrant: 1,
          targetQuadrantName: 'top-right',
          minCoverage: 0.005,
          maxCoverage: 0.10,
          recommendedNext: 'Cast shadow direction exercise',
        },
        referenceGuide: {
          type: 'light_vector',
          description: 'Place your light source marks in the top-right corner',
        },
        tips: [
          'Think of the sun as a point source — draw 4–6 radiating lines from it.',
          'The light direction you establish here will determine where your shadows fall.',
          'Yellow or warm orange colors work best for light markers.',
        ],
      },
      {
        id: 'sphere_step_3',
        stepNumber: 3,
        title: 'Core Shadow & Gradient',
        shortTitle: 'Core Shadow',
        goal: 'Apply heavy dark shading concentrated in the bottom-left quadrant to simulate the core shadow of the sphere.',
        instruction:
          'Using a dark color (dark grey or black), apply graduated shading with your brush in the bottom-left area of your sphere contour. The darkest tones should sit in the bottom-left quadrant, gradually lightening toward the top-right (toward the light source).',
        evaluationCriteria:
          'Dark pixel density should be highest in the bottom-left quadrant. The shading coverage should be between 10–50% of the canvas. Dark-to-light gradient should be evident.',
        xpReward: 70,
        badgeLabel: 'Shadow Sculptor',
        badgeIcon: '🌑',
        cvConfig: {
          contentType: 'shading',
          targetQuadrant: 2,
          targetQuadrantName: 'bottom-left',
          minCoverage: 0.08,
          maxCoverage: 0.55,
          recommendedNext: 'Reflected light highlight exercise',
        },
        referenceGuide: {
          type: 'shading_zone',
          description: 'Concentrate your darkest shading in the bottom-left zone',
        },
        tips: [
          'Start with your darkest tone and gradually fade toward the light source.',
          'Use hatching or cross-hatching for textured gradients.',
          'Leave a small highlight area in the top-right completely unshaded.',
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COURSE 2 — Atmospheric Mountain Perspective
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'course_mountain',
    title: 'Atmospheric Mountain Perspective',
    subtitle: 'Create depth with atmospheric tonal recession',
    description:
      'Master the illusion of depth and atmospheric perspective by rendering layered mountain ridges with diminishing value contrast as ridges recede into the distance.',
    icon: '🏔',
    color: 'from-blue-600 to-cyan-600',
    accentColor: '#3b82f6',
    xpReward: 120,
    locked: false,
    estimatedMinutes: 10,
    steps: [
      {
        id: 'mountain_step_1',
        stepNumber: 1,
        title: 'High-Horizon Distant Ridge',
        shortTitle: 'Distant Ridge',
        goal: 'Draw a faint, high-contrast ridge line positioned in the upper third of the canvas to represent a distant mountain silhouette.',
        instruction:
          'Using a light-medium grey (value 60–80%), draw a jagged or curved mountain ridge line in the top portion of the canvas (above the horizontal midpoint). Keep it soft and thin to convey atmospheric distance.',
        evaluationCriteria:
          'The primary stroke mass should be located above the canvas vertical midpoint (center of mass Y < 0.45). Coverage should be sparse (1–15%) representing a silhouette ridge line.',
        xpReward: 50,
        badgeLabel: 'Horizon Setter',
        badgeIcon: '🌄',
        cvConfig: {
          contentType: 'horizon_ridge',
          targetQuadrant: null,
          targetQuadrantName: 'upper canvas region',
          minCoverage: 0.01,
          maxCoverage: 0.20,
          recommendedNext: 'Mid-ground mountain layer exercise',
        },
        referenceGuide: {
          type: 'horizon_line',
          description: 'Draw your ridge line in the upper third of the canvas',
        },
        tips: [
          'Atmospheric perspective: distant objects are lighter and have less contrast.',
          'A slight curve in the ridge line creates more natural, organic forms.',
          'Use a soft, light grey — avoid harsh darks for the distant layer.',
        ],
      },
      {
        id: 'mountain_step_2',
        stepNumber: 2,
        title: 'Foreground Dark Value Contrast',
        shortTitle: 'Foreground',
        goal: 'Add a strongly contrasting dark foreground silhouette in the lower half of the canvas to create depth separation.',
        instruction:
          'Using deep dark values (near black to dark navy), paint a bold foreground mountain or terrain shape in the bottom half of the canvas. This stark contrast against the lighter background creates the illusion of depth.',
        evaluationCriteria:
          'Dark pixels should be predominantly in the bottom half (BL + BR quadrants). Coverage should be substantial (15–55%). Dark pixel ratio should be above 50%.',
        xpReward: 70,
        badgeLabel: 'Depth Creator',
        badgeIcon: '🌃',
        cvConfig: {
          contentType: 'foreground_value',
          targetQuadrant: 2,
          targetQuadrantName: 'lower canvas region',
          minCoverage: 0.12,
          maxCoverage: 0.55,
          recommendedNext: 'Mid-tone transition layer exercise',
        },
        referenceGuide: {
          type: 'foreground_band',
          description: 'Paint your dark foreground terrain in the lower half',
        },
        tips: [
          'The contrast between your dark foreground and light background IS the depth.',
          'Add irregular edges to your foreground silhouette for a natural feel.',
          'Consider adding a mid-tone layer between background and foreground.',
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COURSE 3 — Human Head Proportions (Loomis Method) [Locked]
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'course_loomis',
    title: 'Human Head Proportions',
    subtitle: 'The Loomis Method — construct any face from any angle',
    description:
      'Unlock the foundational geometric construction method developed by Andrew Loomis to accurately draw human head proportions from any angle. This advanced course requires completing Sphere & Light Mechanics first.',
    icon: '👤',
    color: 'from-rose-600 to-orange-600',
    accentColor: '#f43f5e',
    xpReward: 200,
    locked: true,
    unlockRequirement: 'course_sphere',
    estimatedMinutes: 20,
    steps: [
      {
        id: 'loomis_step_1',
        stepNumber: 1,
        title: 'Cranial Ball Construction',
        shortTitle: 'Cranial Ball',
        goal: 'Draw the initial ball-and-plane foundation of the Loomis head construction.',
        instruction:
          'Begin with a large sphere centered in the upper-middle of the canvas. Cut away the side planes by drawing flattened edges on both lateral sides. This base sphere represents the cranium.',
        evaluationCriteria:
          'Large centered sphere with evidence of side-plane cutting strokes. Coverage 20–50% of canvas.',
        xpReward: 60,
        badgeLabel: 'Anatomist',
        badgeIcon: '💀',
        cvConfig: {
          contentType: 'outline',
          targetQuadrant: null,
          targetQuadrantName: 'center canvas',
          minCoverage: 0.18,
          maxCoverage: 0.50,
          recommendedNext: 'Feature placement guidelines exercise',
        },
        referenceGuide: {
          type: 'loomis_ball',
          description: 'Draw the cranial sphere with side planes indicated',
        },
        tips: [
          'The Loomis ball is slightly wider than a perfect sphere — flatten the sides.',
          'Draw through the form — include the parts you cannot see.',
          'The center line and brow line divide the ball into four equal sections.',
        ],
      },
      {
        id: 'loomis_step_2',
        stepNumber: 2,
        title: 'Feature Guideline Placement',
        shortTitle: 'Guidelines',
        goal: 'Add the cross-axis guidelines: the vertical center line and horizontal brow, nose, and chin lines.',
        instruction:
          'Draw a vertical centerline down the face and three horizontal lines: one at the brow (1/3 from top of ball), one at the base of the nose (2/3 down from brow), and one at the chin (equal distance below nose).',
        evaluationCriteria:
          'Multiple horizontal and vertical construction lines present. Canvas coverage 15–40% indicating structured guidelines.',
        xpReward: 70,
        badgeLabel: 'Proportion Master',
        badgeIcon: '📐',
        cvConfig: {
          contentType: 'outline',
          targetQuadrant: null,
          targetQuadrantName: 'center canvas',
          minCoverage: 0.10,
          maxCoverage: 0.40,
          recommendedNext: 'Facial feature placement exercise',
        },
        referenceGuide: {
          type: 'loomis_guidelines',
          description: 'Draw the vertical and horizontal proportion guidelines',
        },
        tips: [
          'Use light, thin pencil-like strokes for construction lines.',
          'The eyes sit on the horizontal midline of the full head (not just the ball).',
          'These guidelines are temporary tools — they get erased in the final drawing.',
        ],
      },
      {
        id: 'loomis_step_3',
        stepNumber: 3,
        title: 'Jaw & Chin Block-In',
        shortTitle: 'Jaw Block',
        goal: 'Attach the lower face jaw plane extending downward from the cranial ball with correct proportional length.',
        instruction:
          'Below the cranial ball, draw the jaw and chin shape. The distance from the base of the nose to the chin equals the distance from brow to base of nose. Use broad angular strokes to block in the jaw plane.',
        evaluationCriteria:
          'Strokes present in lower half of canvas indicating jaw/chin form. Coverage increases vs previous step (25–55%).',
        xpReward: 70,
        badgeLabel: 'Face Builder',
        badgeIcon: '🎭',
        cvConfig: {
          contentType: 'shading',
          targetQuadrant: 2,
          targetQuadrantName: 'lower-center canvas',
          minCoverage: 0.20,
          maxCoverage: 0.55,
          recommendedNext: 'Full head rendering with features',
        },
        referenceGuide: {
          type: 'loomis_jaw',
          description: 'Block in the jaw plane below the cranial ball',
        },
        tips: [
          'The jaw plane narrows as it moves downward toward the chin.',
          'Male jaws are typically squarer; female jaws taper to a softer point.',
          'Keep the jaw attached to the ball — no floating chin shapes.',
        ],
      },
    ],
  },
];

// ─── Helper Utilities ─────────────────────────────────────────────────────────

/** Flatten all steps from all courses into a single ordered array */
export function getAllSteps() {
  return COURSES.flatMap(course =>
    course.steps.map(step => ({ ...step, courseId: course.id, courseTitle: course.title }))
  );
}

/** Find a course by its ID */
export function getCourseById(courseId) {
  return COURSES.find(c => c.id === courseId) || null;
}

/** Find a step by its ID, enriched with course context */
export function getStepById(stepId) {
  for (const course of COURSES) {
    const step = course.steps.find(s => s.id === stepId);
    if (step) return { ...step, courseId: course.id, courseTitle: course.title };
  }
  return null;
}

/** Total XP available across all courses */
export const TOTAL_XP_POSSIBLE = COURSES.reduce(
  (total, course) => total + course.steps.reduce((s, step) => s + step.xpReward, 0),
  0
);
