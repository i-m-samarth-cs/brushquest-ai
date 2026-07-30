/**
 * BrushQuest AI — Studio View
 * The main drawing workspace: step selector, canvas, submission, and evaluation orchestration.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Zap, Brain, Cpu, Loader2, BookOpen,
  ChevronLeft, ChevronRight, CheckCircle2, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import CanvasBoard from './CanvasBoard.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import { evaluateDrawingWithAI } from '../services/nvidiaVisionService.js';
import { evaluateDrawingLocally } from '../services/cvAnalysisEngine.js';
import { recordSubmission } from '../utils/storage.js';
import { COURSES } from '../config/coursesData.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hasNvidiaKey = () => {
  const key = import.meta.env.VITE_NVIDIA_API_KEY;
  return !!key && key !== 'your_nvidia_api_key_here' && key.length > 10;
};

// ─── Step Selector Tabs ───────────────────────────────────────────────────────
function StepTabs({ steps, currentStep, completedSteps, onSelect }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((step, i) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep.id;
        return (
          <button
            key={step.id}
            onClick={() => onSelect(step)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all',
              isCurrent
                ? 'bg-bq-accent/15 border-bq-accent/40 text-bq-accent'
                : isCompleted
                ? 'bg-bq-green/10 border-bq-green/30 text-bq-green hover:bg-bq-green/15'
                : 'bg-bq-surface/50 border-bq-border/50 text-bq-muted hover:text-bq-text hover:border-bq-border'
            )}
          >
            {isCompleted && <CheckCircle2 size={11} fill="#22c55e" />}
            <span>{step.stepNumber}. {step.shortTitle}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Tips Callout ─────────────────────────────────────────────────────────────
function TipsCallout({ tips }) {
  const [open, setOpen] = useState(false);
  if (!tips?.length) return null;
  return (
    <div className="bg-bq-surface/50 rounded-xl border border-bq-border/30 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-bq-muted hover:text-bq-text transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-bq-accent" />
          Artist Tips for this Step
        </div>
        <ChevronRight size={14} className={clsx('transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-bq-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-bq-accent mt-1.5 flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Evaluation Trigger ───────────────────────────────────────────────────────
function EvalButton({ onEvaluate, isEvaluating }) {
  return (
    <button
      onClick={onEvaluate}
      disabled={isEvaluating}
      className={clsx(
        'w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition-all',
        isEvaluating
          ? 'bg-bq-card border border-bq-border text-bq-muted cursor-not-allowed'
          : 'bg-gradient-to-r from-bq-accent to-bq-accent2 text-white hover:opacity-90 shadow-glow-purple hover:shadow-glow-pink active:scale-[0.98]'
      )}
    >
      {isEvaluating ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          Analyzing your drawing…
        </>
      ) : (
        <>
          <Brain size={20} />
          Evaluate Drawing
        </>
      )}
    </button>
  );
}

// ─── Main StudioView ──────────────────────────────────────────────────────────
export default function StudioView({ initialStep, progress, onBack, onProgressUpdate }) {
  const canvasRef = useRef(null);

  // Find all steps for the same course — stabilised with useMemo so
  // useCallback deps referencing courseSteps don't recreate on every render.
  const course = useMemo(
    () => COURSES.find(c => c.id === initialStep.courseId),
    [initialStep.courseId]
  );
  const courseSteps = useMemo(
    () => course
      ? course.steps.map(s => ({ ...s, courseId: course.id, courseTitle: course.title }))
      : [initialStep],
    [course, initialStep]
  );

  const [activeStep, setActiveStep] = useState(() => {
    return courseSteps.find(s => s.id === initialStep.id) || courseSteps[0];
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [evalMeta, setEvalMeta] = useState(null); // { xpAwarded, isFirstPass }
  const [evalError, setEvalError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const nvidiaEnabled = hasNvidiaKey();

  // ── Navigate to prev/next step ────────────────────────────────────────────
  const currentIdx = courseSteps.findIndex(s => s.id === activeStep.id);

  const goToStep = useCallback((step) => {
    setActiveStep(step);
    setEvalResult(null);
    setEvalError(null);
    // Clear canvas when switching steps
    canvasRef.current?.clearCanvas?.();
  }, []);

  const goNext = useCallback(() => {
    if (currentIdx < courseSteps.length - 1) goToStep(courseSteps[currentIdx + 1]);
    else onBack(); // Course done, return to roadmap
  }, [currentIdx, courseSteps, goToStep, onBack]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) goToStep(courseSteps[currentIdx - 1]);
  }, [currentIdx, courseSteps, goToStep]);

  // ── Evaluate drawing ──────────────────────────────────────────────────────
  const handleEvaluate = useCallback(async () => {
    if (isEvaluating) return;
    setEvalError(null);
    setIsEvaluating(true);

    try {
      let result;

      if (nvidiaEnabled) {
        // Try NVIDIA Vision first
        try {
          const dataURL = canvasRef.current?.getDataURL();
          if (!dataURL) throw new Error('Canvas returned no image data.');
          result = await evaluateDrawingWithAI(dataURL, activeStep);
        } catch (nvidiaErr) {
          if (nvidiaErr.message === 'NVIDIA_API_KEY_MISSING') {
            // Fall through to CV engine
            const canvas = canvasRef.current?.getCanvas();
            result = evaluateDrawingLocally(canvas, activeStep);
          } else {
            // Real API error — surface it but fall back to CV
            console.warn('NVIDIA API error, falling back to CV engine:', nvidiaErr.message);
            const canvas = canvasRef.current?.getCanvas();
            result = evaluateDrawingLocally(canvas, activeStep);
          }
        }
      } else {
        // No API key — use local CV engine
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) throw new Error('Canvas element not available.');
        result = evaluateDrawingLocally(canvas, activeStep);
      }

      // Persist result and award XP
      const submissionData = recordSubmission(
        activeStep.id,
        activeStep.courseId,
        result,
        activeStep.xpReward
      );

      setEvalResult(result);
      setEvalMeta({
        xpAwarded: submissionData.xpAwarded,
        isFirstPass: submissionData.isFirstPass,
      });
      setShowModal(true);

      // Propagate updated progress to parent
      if (onProgressUpdate) {
        onProgressUpdate(submissionData.state);
      }
    } catch (err) {
      setEvalError(err.message || 'Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  }, [isEvaluating, nvidiaEnabled, activeStep, onProgressUpdate]);

  // ── Close modal and optionally retry ─────────────────────────────────────
  const handleClose = useCallback(() => {
    setShowModal(false);
    setEvalResult(null);
  }, []);

  const handleRetry = useCallback(() => {
    setShowModal(false);
    setEvalResult(null);
    canvasRef.current?.clearCanvas?.();
  }, []);

  const handleNextStep = useCallback(() => {
    setShowModal(false);
    setEvalResult(null);
    goNext();
  }, [goNext]);

  // ── Determine if next step exists ─────────────────────────────────────────
  const hasNextStep = currentIdx < courseSteps.length - 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-bq-muted hover:text-bq-text text-sm font-medium transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Roadmap</span>
        </button>
        <div className="h-4 w-px bg-bq-border" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{course?.icon}</span>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-bq-text text-base sm:text-lg truncate">{course?.title}</h1>
            <p className="text-xs text-bq-muted truncate">{activeStep.title}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Step navigation arrows */}
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="p-2 rounded-lg border border-bq-border text-bq-muted hover:text-bq-text hover:border-bq-accent/50 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-bq-muted font-mono">{currentIdx + 1}/{courseSteps.length}</span>
          <button
            onClick={goNext}
            disabled={currentIdx === courseSteps.length - 1}
            className="p-2 rounded-lg border border-bq-border text-bq-muted hover:text-bq-text hover:border-bq-accent/50 transition-all disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Step tabs */}
      <div className="mb-4">
        <StepTabs
          steps={courseSteps}
          currentStep={activeStep}
          completedSteps={progress.completedSteps || []}
          onSelect={goToStep}
        />
      </div>

      {/* Main layout: Canvas + sidebar */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Canvas column */}
        <div className="flex-1 min-w-0">
          <CanvasBoard
            ref={canvasRef}
            lessonStep={activeStep}
            disabled={isEvaluating}
          />
        </div>

        {/* Sidebar */}
        <div className="xl:w-72 flex flex-col gap-4 xl:flex-shrink-0">


          {/* Step goal */}
          <div className="bg-bq-card rounded-xl border border-bq-border/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-bq-muted uppercase tracking-wider">
              <BookOpen size={12} />
              This Step's Goal
            </div>
            <p className="text-sm text-bq-text leading-relaxed">{activeStep.goal}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Zap size={12} className="text-bq-gold" />
              <span className="text-xs text-bq-gold font-mono font-bold">+{activeStep.xpReward} XP on completion</span>
            </div>
          </div>

          {/* Evaluation criteria */}
          <div className="bg-bq-surface/50 rounded-xl border border-bq-border/30 p-4 space-y-2">
            <div className="text-xs font-semibold text-bq-muted uppercase tracking-wider">Evaluation Criteria</div>
            <p className="text-xs text-bq-muted leading-relaxed">{activeStep.evaluationCriteria}</p>
          </div>

          {/* Artist tips */}
          <TipsCallout tips={activeStep.tips} />

          {/* Evaluate button */}
          <EvalButton
            onEvaluate={handleEvaluate}
            isEvaluating={isEvaluating}
          />

          {/* Error display */}
          {evalError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 leading-relaxed animate-slide-up">
              <strong>Error: </strong>{evalError}
            </div>
          )}

          {/* Previous score if exists */}
          {progress.stepScores?.[activeStep.id] && (
            <div className="flex items-center justify-between rounded-xl bg-bq-surface/50 border border-bq-border/30 px-3 py-2.5 text-xs">
              <span className="text-bq-muted">Best Score</span>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'font-bold font-mono',
                  progress.stepScores[activeStep.id].passed ? 'text-bq-green' : 'text-bq-gold'
                )}>
                  {progress.stepScores[activeStep.id].bestScore}%
                </span>
                {progress.stepScores[activeStep.id].passed && (
                  <CheckCircle2 size={13} className="text-bq-green" fill="#22c55e" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showModal && evalResult && (
        <FeedbackModal
          result={evalResult}
          lessonStep={activeStep}
          xpAwarded={evalMeta?.xpAwarded || 0}
          isFirstPass={evalMeta?.isFirstPass || false}
          onClose={handleClose}
          onRetry={handleRetry}
          onNextStep={hasNextStep ? handleNextStep : null}
        />
      )}
    </div>
  );
}
