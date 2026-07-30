/**
 * BrushQuest AI — Gemini Vision Service
 * Calls Google's Gemini 1.5 Flash model with the canvas image to evaluate
 * drawing accuracy against the current lesson step requirements.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-1.5-flash';

// ─── System prompt that forces Gemini to return strict JSON ─────────────────
function buildEvaluationPrompt(lessonStep) {
  return `You are an expert fine art instructor and drawing analyst for BrushQuest AI, a gamified micro-art academy.

You are evaluating a student's canvas drawing for the following lesson step:
  Course: "${lessonStep.courseTitle}"
  Step:   "${lessonStep.title}"
  Goal:   "${lessonStep.goal}"
  Criteria: "${lessonStep.evaluationCriteria}"

Analyze the provided image carefully and assess:
1. Whether the student has attempted the correct subject matter.
2. The accuracy and quality of brush strokes relative to the lesson goal.
3. The application of light and shadow physics where relevant.
4. Spatial positioning of key elements (e.g., shading in correct quadrant).

You MUST respond with ONLY a valid JSON object matching this exact schema (no markdown fences, no commentary):
{
  "score": <integer 0-100>,
  "passed": <boolean, true if score >= 65>,
  "strokeAccuracy": <integer 0-100>,
  "lightPhysicsScore": <integer 0-100>,
  "detailedAnalysis": "<2-3 sentence honest expert analysis of what is visible in the drawing>",
  "constructiveCorrection": "<1-2 sentence specific actionable improvement tip>",
  "recommendedNextExercise": "<name of a specific follow-up exercise the student should practice>"
}`;
}

// ─── Strip markdown fences Gemini sometimes wraps JSON in ───────────────────
function extractJSON(text) {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Attempt to extract first {...} block
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return text.trim();
}

// ─── Validate that the parsed object has all required fields ─────────────────
function validateResponse(obj) {
  const required = [
    'score', 'passed', 'strokeAccuracy', 'lightPhysicsScore',
    'detailedAnalysis', 'constructiveCorrection', 'recommendedNextExercise',
  ];
  for (const key of required) {
    if (obj[key] === undefined || obj[key] === null) {
      throw new Error(`Gemini response missing required field: "${key}"`);
    }
  }
  // Normalize numeric fields
  obj.score = Math.max(0, Math.min(100, Math.round(Number(obj.score))));
  obj.strokeAccuracy = Math.max(0, Math.min(100, Math.round(Number(obj.strokeAccuracy))));
  obj.lightPhysicsScore = Math.max(0, Math.min(100, Math.round(Number(obj.lightPhysicsScore))));
  obj.passed = obj.score >= 65;
  return obj;
}

/**
 * Evaluate a canvas drawing using Gemini Vision.
 *
 * @param {string} base64ImageData  - Pure base64 string from canvas.toDataURL().
 *                                    Strip the "data:image/png;base64," prefix before passing.
 * @param {Object} lessonStep       - The current lesson step configuration object from coursesData.
 * @returns {Promise<Object>}       - Validated evaluation result matching the schema above.
 */
export async function evaluateDrawingWithGemini(base64ImageData, lessonStep) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = buildEvaluationPrompt(lessonStep);

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64ImageData,
    },
  };

  let rawText;
  try {
    const result = await model.generateContent([prompt, imagePart]);
    rawText = result.response.text();
  } catch (apiError) {
    // Re-throw with more context
    throw new Error(`Gemini API call failed: ${apiError.message}`);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Gemini returned an empty response.');
  }

  const jsonString = extractJSON(rawText);

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(`Failed to parse Gemini JSON response. Raw: ${rawText.substring(0, 200)}`);
  }

  return validateResponse(parsed);
}

/**
 * Main exported entry point.
 * Accepts a full data URL (e.g., canvas.toDataURL()) and a lessonStep config.
 * Strips the data URL prefix automatically.
 *
 * @param {string} dataURL   - Full data URL string from canvas.toDataURL("image/png")
 * @param {Object} lessonStep
 * @returns {Promise<Object>}
 */
export async function evaluateDrawingWithAI(dataURL, lessonStep) {
  // Strip the data URL scheme prefix: "data:image/png;base64,"
  const base64Data = dataURL.replace(/^data:image\/[a-z]+;base64,/, '');
  return evaluateDrawingWithGemini(base64Data, lessonStep);
}
