/**
 * BrushQuest AI — User Progress & Persistence Layer
 *
 * All user state persists to localStorage under a single serialized key.
 * Includes streak tracking, XP accounting, level progression, and
 * a capped submission history log.
 */

import { saveProgressToBackend } from '../services/api.js';

const MAX_HISTORY_ENTRIES = 50;
let currentState = null;
let currentUserId = null;

// ─── Default State ────────────────────────────────────────────────────────────

function defaultState() {
  return {
    // Identity
    username: 'Art Apprentice',
    avatarSeed: Math.floor(Math.random() * 1000),

    // XP & Levels
    totalXP: 0,
    level: 1,
    xpToNextLevel: 100,

    // Streaks
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null, // ISO date string YYYY-MM-DD

    // Progress
    completedSteps: [],      // array of step IDs
    completedCourses: [],    // array of course IDs
    unlockedCourses: ['course_sphere', 'course_mountain'], // default unlocked

    // Per-step best scores
    stepScores: {},          // { stepId: { score, attempts, passed, lastSubmittedAt } }

    // Submission history (capped at MAX_HISTORY_ENTRIES)
    submissionHistory: [],   // [{ stepId, courseId, score, passed, timestamp }]

    // Badges earned
    badges: [],              // array of { id, label, icon, earnedAt }

    // Settings
    settings: {
      soundEnabled: true,
      showReferenceGuide: true,
      preferredBrushSize: 8,
      preferredBrushColor: '#1a1a2e',
    },

    // Meta
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

// ─── Load / Save ──────────────────────────────────────────────────────────────

export function setInitialState(userId, state) {
  currentUserId = userId;
  currentState = state ? { ...defaultState(), ...state } : defaultState();
  // Ensure defaults for any new properties
  currentState = { ...defaultState(), ...currentState };
  return currentState;
}

function loadState() {
  if (currentState) return currentState;
  return defaultState();
}

function saveState(state) {
  currentState = state;
  if (currentUserId) {
    saveProgressToBackend(currentUserId, state).catch(err => {
      console.warn('BrushQuest: Failed to save progress to backend.', err);
    });
  }
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Update streak counters based on the last activity date.
 * Call this every time a submission is recorded.
 */
function updateStreak(state) {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const last = state.lastActivityDate;

  if (last === today) {
    // Already practiced today — streak unchanged
    return state;
  } else if (last === yesterday) {
    // Consecutive day — increment streak
    state.currentStreak += 1;
  } else {
    // Streak broken — reset to 1
    state.currentStreak = 1;
  }

  state.longestStreak = Math.max(state.currentStreak, state.longestStreak);
  state.lastActivityDate = today;
  return state;
}

// ─── XP & Level ──────────────────────────────────────────────────────────────

/** XP required to reach a given level (quadratic scaling) */
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.4));
}

function recalculateLevel(state) {
  let level = 1;
  let remaining = state.totalXP;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  state.level = level;
  state.xpToNextLevel = xpForLevel(level) - remaining;
  state.xpInCurrentLevel = remaining;
  return state;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Load the full progress state */
export function getProgress() {
  return loadState();
}

/** Save an arbitrary partial update to the progress state */
export function saveProgress(updates) {
  const state = { ...loadState(), ...updates };
  saveState(state);
  return state;
}

export function resetProgress() {
  currentState = defaultState();
  if (currentUserId) {
    saveProgressToBackend(currentUserId, currentState).catch(e => console.warn(e));
  }
  return currentState;
}

/**
 * Record a drawing submission result.
 * Updates streaks, XP, level, step scores, and history.
 *
 * @param {string} stepId
 * @param {string} courseId
 * @param {Object} evaluationResult  - The result object from Gemini or CV engine
 * @param {number} xpReward          - XP to award if passed
 * @returns {Object} Updated progress state + delta info
 */
export function recordSubmission(stepId, courseId, evaluationResult, xpReward) {
  let state = loadState();

  const { score, passed } = evaluationResult;
  const timestamp = new Date().toISOString();

  // ── Update streak ──────────────────────────────────────────────────────────
  state = updateStreak(state);

  // ── Update step score record ───────────────────────────────────────────────
  const prevRecord = state.stepScores[stepId] || { score: 0, attempts: 0, passed: false };
  const isFirstPass = passed && !prevRecord.passed;
  const isNewHighScore = score > (prevRecord.score || 0);

  state.stepScores[stepId] = {
    score: Math.max(prevRecord.score || 0, score),
    bestScore: Math.max(prevRecord.score || 0, score),
    attempts: (prevRecord.attempts || 0) + 1,
    passed: passed || prevRecord.passed,
    lastSubmittedAt: timestamp,
    firstPassedAt: isFirstPass ? timestamp : prevRecord.firstPassedAt,
  };

  // ── Award XP (only on first pass or new high score) ───────────────────────
  let xpAwarded = 0;
  if (passed) {
    if (isFirstPass) {
      xpAwarded = xpReward;
    } else if (isNewHighScore && !isFirstPass) {
      xpAwarded = Math.floor(xpReward * 0.25); // 25% bonus for improvement
    }
  } else {
    xpAwarded = Math.floor(score * 0.5); // Partial XP for attempts
  }
  state.totalXP += xpAwarded;
  state = recalculateLevel(state);

  // ── Mark step/course as completed ─────────────────────────────────────────
  if (passed && !state.completedSteps.includes(stepId)) {
    state.completedSteps.push(stepId);
  }

  // ── Add submission to history (capped) ────────────────────────────────────
  const entry = { stepId, courseId, score, passed, timestamp, xpAwarded };
  state.submissionHistory = [entry, ...state.submissionHistory].slice(0, MAX_HISTORY_ENTRIES);

  // ── Check if course is fully completed ────────────────────────────────────
  // (Handled by caller using COURSES data; just persist the array)

  // ── Unlock Loomis course if Sphere is completed ───────────────────────────
  const sphereStepIds = ['sphere_step_1', 'sphere_step_2', 'sphere_step_3'];
  const sphereComplete = sphereStepIds.every(id => state.completedSteps.includes(id));
  if (sphereComplete && !state.completedCourses.includes('course_sphere')) {
    state.completedCourses.push('course_sphere');
  }
  if (sphereComplete && !state.unlockedCourses.includes('course_loomis')) {
    state.unlockedCourses.push('course_loomis');
  }

  saveState(state);

  return {
    state,
    xpAwarded,
    isFirstPass,
    isNewHighScore,
    leveledUp: state.level > (prevRecord._level || 1),
    newStreak: state.currentStreak,
  };
}

/**
 * Update user settings (brush preferences, sound, etc.)
 * @param {Object} settingsUpdates
 */
export function saveSettings(settingsUpdates) {
  const state = loadState();
  state.settings = { ...state.settings, ...settingsUpdates };
  saveState(state);
  return state.settings;
}

/**
 * Check if a course is unlocked for the current user.
 * @param {string} courseId
 * @returns {boolean}
 */
export function isCourseUnlocked(courseId) {
  const state = loadState();
  return state.unlockedCourses.includes(courseId);
}

/**
 * Get the best score for a given step.
 * @param {string} stepId
 * @returns {number} Best score (0 if never attempted)
 */
export function getStepBestScore(stepId) {
  const state = loadState();
  return state.stepScores[stepId]?.bestScore || 0;
}
