/**
 * BrushQuest AI — Local Computer Vision & Geometry Analysis Engine
 *
 * A real client-side image processing fallback that runs entirely in the browser
 * using raw ImageData pixel math. Executes when no Gemini API key is configured,
 * ensuring the app NEVER fails or returns hardcoded scores.
 *
 * Analysis pipeline:
 *  1. Read raw RGBA pixels from canvas context via getImageData.
 *  2. Compute non-empty pixel coverage, stroke density, and luminosity distribution.
 *  3. Divide the canvas into quadrants and compute per-quadrant pixel density.
 *  4. Compare detected drawing characteristics against the lesson step's target
 *     quadrant, center-of-mass expectations, and content type.
 *  5. Return a scored result identical in schema to the Gemini Vision service.
 */

// ─── Pixel helpers ───────────────────────────────────────────────────────────

/**
 * Determine if a pixel (r,g,b,a) is "drawn" (non-background).
 * Background is assumed to be near-white (#f8f8f8+) or fully transparent.
 */
function isDrawnPixel(r, g, b, a) {
  if (a < 30) return false; // transparent
  const brightness = (r + g + b) / 3;
  // White/near-white background pixels
  if (brightness > 235 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return false;
  return true;
}

/**
 * Calculate luminosity (0-1) of a pixel using perceptual weights.
 */
function pixelLuminosity(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// ─── Core Analysis ───────────────────────────────────────────────────────────

/**
 * Extract comprehensive pixel statistics from an ImageData object.
 *
 * @param {ImageData} imageData
 * @returns {Object} stats
 */
function extractPixelStats(imageData) {
  const { data, width, height } = imageData;
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  let totalDrawn = 0;
  let sumX = 0;
  let sumY = 0;
  let sumLuminosity = 0;
  let darkPixelCount = 0; // luminosity < 0.35
  let lightPixelCount = 0; // luminosity > 0.7

  // Quadrant pixel counts: TL, TR, BL, BR
  const quadrantDrawn = [0, 0, 0, 0];
  const quadrantDark = [0, 0, 0, 0];
  const quadrantTotal = [
    halfW * halfH,
    (width - halfW) * halfH,
    halfW * (height - halfH),
    (width - halfW) * (height - halfH),
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (!isDrawnPixel(r, g, b, a)) continue;

      totalDrawn++;
      sumX += x;
      sumY += y;

      const lum = pixelLuminosity(r, g, b);
      sumLuminosity += lum;

      if (lum < 0.35) darkPixelCount++;
      if (lum > 0.7) lightPixelCount++;

      // Assign to quadrant
      const qx = x < halfW ? 0 : 1;
      const qy = y < halfH ? 0 : 1;
      const qIdx = qy * 2 + qx; // TL=0, TR=1, BL=2, BR=3
      quadrantDrawn[qIdx]++;
      if (lum < 0.35) quadrantDark[qIdx]++;
    }
  }

  const coverage = totalDrawn / (width * height);
  const centerOfMassX = totalDrawn > 0 ? sumX / totalDrawn / width : 0.5;
  const centerOfMassY = totalDrawn > 0 ? sumY / totalDrawn / height : 0.5;
  const avgLuminosity = totalDrawn > 0 ? sumLuminosity / totalDrawn : 1;

  // Quadrant density ratios (drawn pixels / total pixels in quadrant)
  const quadrantDensity = quadrantDrawn.map((d, i) =>
    quadrantTotal[i] > 0 ? d / quadrantTotal[i] : 0
  );

  // Dark pixel ratio per quadrant
  const quadrantDarkRatio = quadrantDrawn.map((d, i) =>
    d > 0 ? quadrantDark[i] / d : 0
  );

  return {
    totalDrawn,
    coverage,
    centerOfMassX,
    centerOfMassY,
    avgLuminosity,
    darkPixelCount,
    lightPixelCount,
    darkRatio: totalDrawn > 0 ? darkPixelCount / totalDrawn : 0,
    lightRatio: totalDrawn > 0 ? lightPixelCount / totalDrawn : 0,
    quadrantDrawn,
    quadrantDensity,
    quadrantDarkRatio,
    width,
    height,
  };
}

// ─── Step-specific Scoring Algorithms ────────────────────────────────────────

/**
 * Generic scoring that checks if a drawing satisfies a lesson step's
 * spatial and density expectations.
 *
 * @param {Object} stats      - Pixel statistics from extractPixelStats
 * @param {Object} lessonStep - The lesson step config from coursesData
 * @returns {{ strokeAccuracy: number, lightPhysicsScore: number, positionScore: number }}
 */
function computeStepScore(stats, lessonStep) {
  const { targetQuadrant, contentType, minCoverage, maxCoverage } = lessonStep.cvConfig || {};

  // ── 1. Coverage Score (0-100) ──────────────────────────────────────────────
  // Reward drawing within an expected coverage band
  const min = minCoverage || 0.02;
  const max = maxCoverage || 0.6;
  let coverageScore;
  if (stats.coverage < min) {
    coverageScore = (stats.coverage / min) * 50;
  } else if (stats.coverage > max) {
    coverageScore = Math.max(40, 100 - (stats.coverage - max) / max * 60);
  } else {
    const normalized = (stats.coverage - min) / (max - min);
    coverageScore = 60 + normalized * 40;
  }
  coverageScore = Math.min(100, Math.max(0, coverageScore));

  // ── 2. Stroke Accuracy (0-100) ─────────────────────────────────────────────
  // Based on coverage and overall drawing presence
  const strokeAccuracy = Math.round(
    coverageScore * 0.6 +
    (stats.totalDrawn > 500 ? 40 : (stats.totalDrawn / 500) * 40)
  );

  // ── 3. Quadrant / Positional Score (0-100) ────────────────────────────────
  // TL=0, TR=1, BL=2, BR=3
  let positionScore = 50; // neutral if no target defined
  if (targetQuadrant !== undefined && targetQuadrant !== null) {
    const targetDensity = stats.quadrantDensity[targetQuadrant];
    const otherDensities = stats.quadrantDensity.filter((_, i) => i !== targetQuadrant);
    const avgOther = otherDensities.reduce((a, b) => a + b, 0) / otherDensities.length;
    // How much more dense is the target quadrant vs the average of others?
    const ratio = avgOther > 0 ? targetDensity / (avgOther + 0.001) : targetDensity * 1000;
    positionScore = Math.min(100, Math.round(ratio * 35 + targetDensity * 500));
  }

  // ── 4. Light Physics Score (0-100) ────────────────────────────────────────
  // For shading steps: reward dark pixels in the correct quadrant
  let lightPhysicsScore = 50;
  if (contentType === 'shading' && targetQuadrant !== undefined) {
    const darkRatioInTarget = stats.quadrantDarkRatio[targetQuadrant];
    // How dark is the target quadrant? Reward values closer to 1.0
    lightPhysicsScore = Math.min(100, Math.round(darkRatioInTarget * 100 + positionScore * 0.3));
  } else if (contentType === 'outline') {
    // For outlines: reward moderate coverage that isn't too dense (not a filled blob)
    const isModerate = stats.coverage > 0.02 && stats.coverage < 0.35;
    lightPhysicsScore = isModerate
      ? Math.min(100, Math.round(60 + (1 - Math.abs(stats.coverage - 0.1) / 0.1) * 40))
      : Math.round(stats.coverage * 100);
  } else if (contentType === 'light_vector') {
    // For light ray steps: reward high-contrast strokes in top-right (quadrant 1)
    const trDensity = stats.quadrantDensity[1]; // TR
    lightPhysicsScore = Math.min(100, Math.round(trDensity * 800 + 20));
  } else if (contentType === 'horizon_ridge') {
    // For perspective steps: reward strokes concentrated near top 25% of canvas
    const topStrip = stats.centerOfMassY < 0.4 ? 100 - stats.centerOfMassY * 100 : 30;
    lightPhysicsScore = Math.round(topStrip);
  } else if (contentType === 'foreground_value') {
    // For foreground dark value: reward dark pixels overall
    lightPhysicsScore = Math.min(100, Math.round(stats.darkRatio * 150));
  }
  lightPhysicsScore = Math.max(0, Math.min(100, lightPhysicsScore));

  return {
    strokeAccuracy: Math.max(0, Math.min(100, strokeAccuracy)),
    lightPhysicsScore,
    positionScore: Math.max(0, Math.min(100, positionScore)),
    coverageScore: Math.max(0, Math.min(100, Math.round(coverageScore))),
  };
}

// ─── Human-readable Analysis Generator ───────────────────────────────────────

function generateAnalysisText(stats, scores, lessonStep) {
  const coveragePct = Math.round(stats.coverage * 100);
  const { contentType, targetQuadrantName } = lessonStep.cvConfig || {};

  const analyses = [];

  if (stats.totalDrawn < 200) {
    analyses.push(
      'The canvas appears nearly blank or has minimal marks. Ensure you are drawing with sufficient coverage for the exercise.'
    );
  } else {
    analyses.push(
      `Your drawing covers approximately ${coveragePct}% of the canvas surface with ${stats.totalDrawn.toLocaleString()} drawn pixels detected.`
    );
  }

  if (contentType === 'shading' && targetQuadrantName) {
    const darkPct = Math.round(stats.quadrantDarkRatio[lessonStep.cvConfig.targetQuadrant] * 100);
    analyses.push(
      `Dark shading density in the ${targetQuadrantName} region is ${darkPct}% — ${darkPct > 50 ? 'well-positioned for the core shadow.' : 'needs to be more concentrated in that region.'}`
    );
  } else if (contentType === 'outline') {
    const isCircular = Math.abs(stats.centerOfMassX - 0.5) < 0.18 && Math.abs(stats.centerOfMassY - 0.5) < 0.18;
    analyses.push(
      isCircular
        ? 'The stroke distribution is centered, suggesting a good circular contour attempt.'
        : 'The center of mass of your strokes is off-center — aim to keep your circular outline balanced around the canvas center.'
    );
  } else if (contentType === 'light_vector') {
    analyses.push(
      `Your light vector marks are positioned in the ${stats.centerOfMassX > 0.5 && stats.centerOfMassY < 0.5 ? 'top-right area as expected' : 'wrong region — move your light ray marks to the top-right quadrant'}.`
    );
  }

  analyses.push(
    `Overall composition score: ${scores.positionScore}/100 for spatial accuracy.`
  );

  return analyses.join(' ');
}

function generateCorrectionText(scores, lessonStep) {
  const { contentType, targetQuadrantName } = lessonStep.cvConfig || {};

  if (scores.positionScore < 40) {
    if (contentType === 'shading' && targetQuadrantName) {
      return `Focus your dark shading strokes more heavily in the ${targetQuadrantName} region to accurately simulate core shadow placement based on the light source direction.`;
    }
    if (contentType === 'outline') {
      return 'Keep your oval/circle strokes centered on the canvas — use the reference guide overlay to align your contour precisely.';
    }
    if (contentType === 'light_vector') {
      return 'Draw your light source direction lines (short radiating strokes) clearly in the top-right quadrant of the canvas.';
    }
  }

  if (scores.strokeAccuracy < 50) {
    return 'Add more deliberate, controlled strokes. Avoid rushed marks — build up the drawing gradually with consistent pressure.';
  }

  if (scores.lightPhysicsScore < 55) {
    return `Strengthen the ${contentType === 'shading' ? 'tonal contrast in your shadow region' : 'overall tonal range'} by applying darker values more intentionally.`;
  }

  return `Good foundation! Refine edge quality and increase stroke commitment to push your score higher — study the reference overlay carefully.`;
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Evaluate a canvas drawing locally using computer vision pixel analysis.
 * Returns the same JSON schema as the Gemini Vision service.
 *
 * @param {HTMLCanvasElement} canvas    - The canvas DOM element to analyze.
 * @param {Object}            lessonStep - The lesson step config from coursesData.
 * @returns {Object} Evaluation result matching the shared schema.
 */
export function evaluateDrawingLocally(canvas, lessonStep) {
  if (!canvas) {
    throw new Error('Canvas element is required for CV analysis.');
  }

  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const stats = extractPixelStats(imageData);
  const scores = computeStepScore(stats, lessonStep);

  // Weighted composite score
  const compositeScore = Math.round(
    scores.strokeAccuracy * 0.35 +
    scores.lightPhysicsScore * 0.35 +
    scores.positionScore * 0.30
  );

  const finalScore = Math.max(0, Math.min(100, compositeScore));
  const passed = finalScore >= 65;

  const detailedAnalysis = generateAnalysisText(stats, scores, lessonStep);
  const constructiveCorrection = generateCorrectionText(scores, lessonStep);

  return {
    score: finalScore,
    passed,
    strokeAccuracy: scores.strokeAccuracy,
    lightPhysicsScore: scores.lightPhysicsScore,
    detailedAnalysis,
    constructiveCorrection,
    recommendedNextExercise: passed
      ? lessonStep.cvConfig?.recommendedNext || 'Advanced tonal gradient exercise'
      : `Repeat: ${lessonStep.title} — focus on ${lessonStep.cvConfig?.targetQuadrantName || 'spatial accuracy'}`,
    // Internal debug metadata (stripped from UI but useful in console)
    _cvMeta: {
      coverage: Math.round(stats.coverage * 100),
      totalDrawnPixels: stats.totalDrawn,
      centerOfMass: { x: stats.centerOfMassX.toFixed(3), y: stats.centerOfMassY.toFixed(3) },
      quadrantDensity: stats.quadrantDensity.map(d => (d * 100).toFixed(2) + '%'),
      positionScore: scores.positionScore,
      coverageScore: scores.coverageScore,
    },
  };
}
