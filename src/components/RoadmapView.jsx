/**
 * BrushQuest AI — Roadmap View
 * Duolingo-style learning path showing courses and micro-steps as
 * connected nodes on a vertical winding path.
 */

import { Lock, CheckCircle2, Circle, Star, Clock, ChevronRight, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { COURSES } from '../config/coursesData.js';

// ─── Step Node ────────────────────────────────────────────────────────────────
function StepNode({ step, isCompleted, isCurrent, isLocked, score, onClick, index }) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={clsx(
        'flex items-center gap-4',
        isEven ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {/* Step info card */}
      <div
        className={clsx(
          'flex-1 rounded-xl border p-3 transition-all duration-200',
          isEven ? 'text-left' : 'text-right',
          isLocked
            ? 'border-bq-border/30 bg-bq-surface/30 opacity-50 cursor-not-allowed'
            : isCurrent
            ? 'border-bq-accent/40 bg-bq-accent/5 cursor-pointer hover:border-bq-accent/70 hover:bg-bq-accent/10'
            : isCompleted
            ? 'border-bq-green/30 bg-bq-green/5 cursor-pointer hover:border-bq-green/50'
            : 'border-bq-border/40 bg-bq-surface/40 cursor-pointer hover:border-bq-border'
        )}
        onClick={() => !isLocked && onClick(step)}
      >
        <div className="flex items-center gap-2 mb-1" style={{ justifyContent: isEven ? 'flex-start' : 'flex-end' }}>
          <span className="text-xs font-semibold text-bq-muted">Step {step.stepNumber}</span>
          {isCompleted && score > 0 && (
            <div className="flex items-center gap-0.5 text-bq-gold">
              <Star size={10} fill="#f59e0b" />
              <span className="text-xs font-bold font-mono">{score}</span>
            </div>
          )}
        </div>
        <p className={clsx(
          'text-sm font-semibold',
          isCurrent ? 'text-bq-accent' : isCompleted ? 'text-bq-text' : 'text-bq-muted'
        )}>
          {step.title}
        </p>
        {isCurrent && (
          <p className="text-xs text-bq-muted mt-0.5 line-clamp-1">{step.goal}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5" style={{ justifyContent: isEven ? 'flex-start' : 'flex-end' }}>
          <span className="text-xs text-bq-gold font-mono">+{step.xpReward} XP</span>
          {step.badgeIcon && <span className="text-xs">{step.badgeIcon}</span>}
        </div>
      </div>

      {/* Node circle */}
      <div className="flex-shrink-0">
        <button
          disabled={isLocked}
          onClick={() => !isLocked && onClick(step)}
          className={clsx(
            'w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-200 shadow-lg',
            isLocked
              ? 'border-bq-border/30 bg-bq-surface/50 cursor-not-allowed'
              : isCompleted
              ? 'border-bq-green bg-bq-green/20 hover:scale-105 hover:shadow-glow-green'
              : isCurrent
              ? 'border-bq-accent bg-bq-accent/20 hover:scale-110 hover:shadow-glow-purple animate-pulse-glow'
              : 'border-bq-border/50 bg-bq-surface/50 hover:border-bq-accent/50 hover:scale-105 cursor-pointer'
          )}
        >
          {isLocked
            ? <Lock size={18} className="text-bq-muted/50" />
            : isCompleted
            ? <CheckCircle2 size={20} className="text-bq-green" fill="#22c55e" />
            : isCurrent
            ? <Play size={18} className="text-bq-accent" fill="#a855f7" />
            : <Circle size={18} className="text-bq-muted/60" />
          }
        </button>
      </div>

      {/* Spacer for opposite side */}
      <div className="flex-1" />
    </div>
  );
}

// ─── Course Card Header ───────────────────────────────────────────────────────
function CourseHeader({ course, isUnlocked, completedCount, totalSteps }) {
  const pct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div
      className={clsx(
        'rounded-2xl border p-5 mb-2 relative overflow-hidden',
        isUnlocked
          ? 'border-bq-border/50 bg-bq-card'
          : 'border-bq-border/20 bg-bq-surface/30 opacity-70'
      )}
    >
      {/* Gradient shimmer background */}
      <div className={clsx(
        'absolute inset-0 opacity-5 bg-gradient-to-br',
        course.color
      )} />

      <div className="relative flex items-start gap-4">
        <div
          className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${course.accentColor}20`, border: `1px solid ${course.accentColor}30` }}
        >
          {course.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-bq-text text-base">{course.title}</h3>
            {!isUnlocked && (
              <div className="flex items-center gap-1 text-bq-muted text-xs bg-bq-surface px-2 py-0.5 rounded-full border border-bq-border/50">
                <Lock size={10} />
                Locked
              </div>
            )}
          </div>
          <p className="text-sm text-bq-muted mt-0.5">{course.subtitle}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-bq-muted">
            <span className="flex items-center gap-1"><Clock size={11} />{course.estimatedMinutes}m</span>
            <span className="flex items-center gap-1"><Star size={11} />{course.xpReward} XP</span>
            <span className="font-mono">{completedCount}/{totalSteps} steps</span>
          </div>
          {isUnlocked && completedCount > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-bq-border overflow-hidden">
              <div
                className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-1000', course.color)}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
      {!isUnlocked && course.unlockRequirement && (
        <div className="relative mt-3 flex items-center gap-2 text-xs text-bq-muted bg-bq-surface/60 rounded-lg px-3 py-2 border border-bq-border/30">
          <Lock size={10} />
          Complete <span className="text-bq-accent font-medium">3D Sphere &amp; Light Mechanics</span> to unlock
        </div>
      )}
    </div>
  );
}

// ─── Connector Line ───────────────────────────────────────────────────────────
function ConnectorLine({ active }) {
  return (
    <div className="flex justify-center my-1">
      <div className={clsx(
        'w-0.5 h-8 rounded-full',
        active ? 'bg-gradient-to-b from-bq-accent/50 to-bq-accent/20' : 'bg-bq-border/30'
      )} />
    </div>
  );
}

// ─── Main RoadmapView ─────────────────────────────────────────────────────────
export default function RoadmapView({ progress, onSelectStep }) {
  const { completedSteps = [], stepScores = {}, unlockedCourses = [] } = progress;

  // Determine current step: first incomplete step across all courses
  const allSteps = COURSES.flatMap(c => c.steps.map(s => ({ ...s, courseId: c.id })));
  const firstIncompleteIdx = allSteps.findIndex(s => !completedSteps.includes(s.id));
  const currentStepId = firstIncompleteIdx >= 0 ? allSteps[firstIncompleteIdx].id : null;

  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-10 animate-fade-in">
      {/* Page header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl font-bold text-bq-text">
          Your <span className="text-bq-accent">Learning Path</span>
        </h1>
        <p className="text-bq-muted text-sm">
          Complete micro-steps to master the fundamentals of fine art
        </p>
      </div>

      {/* Course sections */}
      {COURSES.map((course) => {
        const isUnlocked = unlockedCourses.includes(course.id);
        const completedCount = course.steps.filter(s => completedSteps.includes(s.id)).length;

        return (
          <div key={course.id} className="space-y-1">
            <CourseHeader
              course={course}
              isUnlocked={isUnlocked}
              completedCount={completedCount}
              totalSteps={course.steps.length}
            />

            {/* Step nodes */}
            <div className="px-2 space-y-0">
              {course.steps.map((step, idx) => {
                const enrichedStep = { ...step, courseId: course.id, courseTitle: course.title };
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStepId;
                const isLocked = !isUnlocked;
                const score = stepScores[step.id]?.bestScore || 0;

                return (
                  <div key={step.id}>
                    {idx > 0 && <ConnectorLine active={completedSteps.includes(course.steps[idx - 1].id)} />}
                    <StepNode
                      step={enrichedStep}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isLocked={isLocked}
                      score={score}
                      onClick={onSelectStep}
                      index={idx}
                    />
                  </div>
                );
              })}
            </div>

            {/* Course completion badge */}
            {course.steps.every(s => completedSteps.includes(s.id)) && (
              <div className="flex items-center justify-center mt-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-bq-green/15 border border-bq-green/30 text-bq-green text-sm font-semibold">
                  <CheckCircle2 size={16} fill="#22c55e" />
                  Course Complete! +{course.xpReward} XP Bonus
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* CTA for first step */}
      {currentStepId && (
        <div className="text-center">
          <button
            onClick={() => {
              const step = allSteps.find(s => s.id === currentStepId);
              if (step) onSelectStep(step);
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-bq-accent to-bq-accent2 text-white font-bold text-base hover:opacity-90 transition-all shadow-glow-purple animate-pulse-glow"
          >
            Continue Learning
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
