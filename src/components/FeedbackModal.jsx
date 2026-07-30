/**
 * BrushQuest AI — Feedback Modal
 * Displays AI evaluation results after submission.
 * Triggers canvas-confetti on pass.
 */

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2, XCircle, Zap, Target, Lightbulb,
  BarChart3, ChevronRight, RotateCcw, X
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Score Ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score, passed }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = passed ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        className="rotate-[-90deg]"
      >
        {/* Background track */}
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#334155" strokeWidth="8" />
        {/* Score arc */}
        <circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-display text-white leading-none">{score}</span>
        <span className="text-xs text-bq-muted font-mono mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Sub-score Bar ─────────────────────────────────────────────────────────────
function SubScoreBar({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-bq-muted">
          <Icon size={11} />
          <span>{label}</span>
        </div>
        <span className={clsx('font-bold font-mono', colorClass)}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-bq-border overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', colorClass.replace('text-', 'bg-'))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Feedback Modal ───────────────────────────────────────────────────────
export default function FeedbackModal({
  result,
  lessonStep,
  xpAwarded,
  isFirstPass,
  onClose,
  onNextStep,
  onRetry,
}) {
  const hasTriggeredConfetti = useRef(false);
  const { score, passed, strokeAccuracy, lightPhysicsScore, detailedAnalysis, constructiveCorrection, recommendedNextExercise } = result;

  useEffect(() => {
    if (passed && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      // Burst confetti
      const fire = (particleRatio, opts) => {
        confetti({
          origin: { y: 0.6 },
          ...opts,
          particleCount: Math.floor(200 * particleRatio),
        });
      };
      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#a855f7', '#ec4899'] });
      fire(0.20, { spread: 60, colors: ['#f59e0b', '#22c55e'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#6366f1', '#3b82f6'] });
      fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.10, { spread: 120, startVelocity: 45, colors: ['#f472b6', '#a78bfa'] });
    }
  }, [passed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bq-base/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-bq-card border border-bq-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header band */}
        <div className={clsx(
          'h-1.5 w-full',
          passed ? 'bg-gradient-to-r from-bq-green to-emerald-400' : 'bg-gradient-to-r from-bq-accent to-bq-accent2'
        )} />

        <div className="p-6 space-y-5">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-bq-muted hover:text-bq-text transition-colors"
          >
            <X size={18} />
          </button>

          {/* Score Header */}
          <div className="flex items-start gap-4">
            <ScoreRing score={score} passed={passed} />
            <div className="flex-1 pt-1 space-y-2">
              <div className="flex items-center gap-2">
                {passed
                  ? <CheckCircle2 size={20} className="text-bq-green" fill="#22c55e" />
                  : <XCircle size={20} className="text-red-400" />
                }
                <h2 className={clsx('font-display font-bold text-lg', passed ? 'text-bq-green' : 'text-bq-text')}>
                  {passed ? (isFirstPass ? 'First Pass! 🎉' : 'Step Cleared!') : 'Keep Practicing'}
                </h2>
              </div>
              <p className="text-sm text-bq-muted">
                {lessonStep?.title} — {passed ? 'You nailed it!' : 'Almost there, keep refining.'}
              </p>
              {/* XP Award */}
              {xpAwarded > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bq-gold/15 border border-bq-gold/30 animate-score-tick">
                  <Zap size={12} className="text-bq-gold" fill="#f59e0b" />
                  <span className="text-xs font-bold text-bq-gold font-mono">+{xpAwarded} XP</span>
                  {isFirstPass && <span className="text-xs text-bq-gold/70">First Pass Bonus!</span>}
                </div>
              )}
            </div>
          </div>

          {/* Sub-scores */}
          <div className="space-y-2.5 bg-bq-surface/60 rounded-xl p-4 border border-bq-border/40">
            <h3 className="text-xs font-semibold text-bq-muted uppercase tracking-wider">Score Breakdown</h3>
            <SubScoreBar
              label="Stroke Accuracy"
              value={strokeAccuracy}
              icon={Target}
              colorClass={strokeAccuracy >= 65 ? 'text-bq-green' : strokeAccuracy >= 40 ? 'text-bq-gold' : 'text-red-400'}
            />
            <SubScoreBar
              label="Light Physics"
              value={lightPhysicsScore}
              icon={BarChart3}
              colorClass={lightPhysicsScore >= 65 ? 'text-bq-blue' : lightPhysicsScore >= 40 ? 'text-bq-gold' : 'text-red-400'}
            />
          </div>

          {/* Analysis */}
          <div className="space-y-3">
            <div className="bg-bq-surface/40 rounded-xl p-3.5 border border-bq-border/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-bq-muted uppercase tracking-wider">
                <BarChart3 size={11} />
                AI Analysis
              </div>
              <p className="text-sm text-bq-text leading-relaxed">{detailedAnalysis}</p>
            </div>

            <div className="bg-indigo-500/5 rounded-xl p-3.5 border border-indigo-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                <Lightbulb size={11} />
                Correction
              </div>
              <p className="text-sm text-bq-text leading-relaxed">{constructiveCorrection}</p>
            </div>

            {recommendedNextExercise && (
              <div className="bg-bq-accent/5 rounded-xl p-3 border border-bq-accent/20 space-y-0.5">
                <div className="text-xs font-semibold text-bq-accent uppercase tracking-wider">Recommended Next</div>
                <p className="text-xs text-bq-muted">{recommendedNextExercise}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-bq-border text-bq-muted hover:text-bq-text hover:border-bq-accent/50 transition-all text-sm font-medium flex-1 justify-center"
            >
              <RotateCcw size={15} />
              Try Again
            </button>
            {passed && onNextStep && (
              <button
                onClick={onNextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-bq-accent to-bq-accent2 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-glow-purple flex-1 justify-center"
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            )}
            {!onNextStep && passed && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-bq-green to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition-all flex-1 justify-center"
              >
                Course Complete!
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
