/**
 * BrushQuest AI — NVIDIA Vision Service
 * Calls NVIDIA API (nv-llama-3.2-90b-vision-instruct) with the canvas image to evaluate
 * drawing accuracy against the current lesson step requirements.
 */

const NVIDIA_MODEL = 'meta/llama-3.2-90b-vision-instruct';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// ─── System prompt that forces JSON ─────────────────────────────────────────
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

// ─── Strip markdown fences JSON ─────────────────────────────────────────────
function extractJSON(text) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return text.trim();
}

// ─── Validate response ──────────────────────────────────────────────────────
function validateResponse(obj) {
  const required = [
    'score', 'passed', 'strokeAccuracy', 'lightPhysicsScore',
    'detailedAnalysis', 'constructiveCorrection', 'recommendedNextExercise',
  ];
  for (const key of required) {
    if (obj[key] === undefined || obj[key] === null) {
      throw new Error(`NVIDIA API response missing required field: "${key}"`);
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
 * Evaluate a canvas drawing using NVIDIA API.
 *
 * @param {string} base64ImageData  - Pure base64 string from canvas.toDataURL().
 * @param {Object} lessonStep       - The current lesson step configuration object.
 * @returns {Promise<Object>}       - Validated evaluation result.
 */
export async function evaluateDrawingWithNvidia(base64ImageData, lessonStep) {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey || apiKey === 'your_nvidia_api_key_here') {
    throw new Error('NVIDIA_API_KEY_MISSING');
  }

  const prompt = buildEvaluationPrompt(lessonStep);
  // Re-add the data URL prefix required by OpenAI-compatible vision models
  const dataUrl = `data:image/png;base64,${base64ImageData}`;

  const payload = {
    model: NVIDIA_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    max_tokens: 512,
    temperature: 0.2
  };

  let rawText;
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errData = await response.text();
        throw new Error(`NVIDIA API Error: ${response.status} ${errData}`);
    }

    const data = await response.json();
    rawText = data.choices?.[0]?.message?.content;
  } catch (apiError) {
    throw new Error(`NVIDIA API call failed: ${apiError.message}`);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('NVIDIA API returned an empty response.');
  }

  const jsonString = extractJSON(rawText);

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(`Failed to parse NVIDIA JSON response. Raw: ${rawText.substring(0, 200)}`);
  }

  return validateResponse(parsed);
}

/**
 * Main exported entry point.
 *
 * @param {string} dataURL   - Full data URL string from canvas.toDataURL("image/png")
 * @param {Object} lessonStep
 * @returns {Promise<Object>}
 */
export async function evaluateDrawingWithAI(dataURL, lessonStep) {
  const base64Data = dataURL.replace(/^data:image\/[a-z]+;base64,/, '');
  return evaluateDrawingWithNvidia(base64Data, lessonStep);
}
