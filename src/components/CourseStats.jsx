/**
 * BrushQuest AI — CourseStats
 * Displays XP summary, completion stats, and recent submissions.
 */

import { CheckCircle2, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { COURSES, TOTAL_XP_POSSIBLE } from '../config/coursesData.js';

function StatCard({ icon: Icon, label, value, color = 'text-bq-accent' }) {
  return (
    <div className="flex flex-col gap-1 bg-bq-card rounded-xl p-4 border border-bq-border/50">
      <div className="flex items-center gap-2 text-bq-muted text-xs font-medium">
        <Icon size={13} />
        {label}
      </div>
      <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
    </div>
  );
}

export default function CourseStats({ progress }) {
  const {
    totalXP = 0,
    completedSteps = [],
    currentStreak = 0,
    submissionHistory = [],
    stepScores = {},
  } = progress;

  const totalSteps = COURSES.reduce((t, c) => t + c.steps.length, 0);
  const completionPct = Math.round((completedSteps.length / totalSteps) * 100);
  const xpPct = Math.min(100, Math.round((totalXP / TOTAL_XP_POSSIBLE) * 100));

  // Recent 5 submissions
  const recent = submissionHistory.slice(0, 5);

  // Average score across all attempted steps
  const allScores = Object.values(stepScores).map(s => s.bestScore || 0);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-display text-lg font-semibold text-bq-text">Your Progress</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={CheckCircle2} label="Steps Done" value={`${completedSteps.length}/${totalSteps}`} color="text-bq-green" />
        <StatCard icon={Clock} label="Day Streak" value={currentStreak} color="text-orange-400" />
        <StatCard icon={BookOpen} label="Avg Score" value={`${avgScore}%`} color="text-bq-blue" />
        <StatCard icon={TrendingUp} label="XP Earned" value={totalXP} color="text-bq-gold" />
      </div>

      {/* Overall Completion */}
      <div className="bg-bq-card rounded-xl p-4 border border-bq-border/50 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-bq-muted font-medium">Overall Completion</span>
          <span className="text-bq-text font-bold font-mono">{completionPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-bq-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-bq-accent to-bq-accent2 transition-all duration-1000"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-bq-card rounded-xl p-4 border border-bq-border/50 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-bq-muted font-medium">XP Collected</span>
          <span className="text-bq-gold font-bold font-mono">{totalXP} / {TOTAL_XP_POSSIBLE}</span>
        </div>
        <div className="h-2.5 rounded-full bg-bq-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-bq-gold to-amber-400 transition-all duration-1000"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* Recent Submissions */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-bq-muted">Recent Submissions</h3>
          <div className="space-y-2">
            {recent.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-bq-card rounded-lg px-3 py-2 border border-bq-border/40 text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${entry.passed ? 'bg-bq-green' : 'bg-bq-accent2'}`} />
                  <span className="text-bq-muted font-mono text-xs truncate max-w-[120px]">{entry.stepId.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold font-mono text-xs ${entry.score >= 65 ? 'text-bq-green' : 'text-bq-accent2'}`}>
                    {entry.score}%
                  </span>
                  {entry.xpAwarded > 0 && (
                    <span className="text-bq-gold text-xs font-mono">+{entry.xpAwarded}xp</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
