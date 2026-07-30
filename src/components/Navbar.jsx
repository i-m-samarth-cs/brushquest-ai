/**
 * BrushQuest AI — Navbar
 * Top navigation bar displaying streak, XP, and level status.
 */

import { Flame, Star, Zap, Trophy, Palette } from 'lucide-react';

function XPBar({ totalXP, xpToNextLevel, xpInCurrentLevel }) {
  const filled = xpInCurrentLevel || 0;
  const total = xpToNextLevel || 100;
  const pct = Math.min(100, Math.round((filled / total) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1 text-xs text-bq-muted font-mono">
        <span className="text-bq-gold font-semibold">{totalXP}</span>
        <span>XP</span>
      </div>
      <div className="w-20 sm:w-28 h-2 rounded-full bg-bq-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bq-accent to-bq-accent2 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Navbar({ progress, onLogoClick }) {
  const { currentStreak = 0, level = 1, totalXP = 0, xpToNextLevel = 100, xpInCurrentLevel = 0 } = progress;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-bq-border/60 bg-bq-base/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 group"
          aria-label="BrushQuest Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bq-accent to-bq-accent2 flex items-center justify-center shadow-glow-purple">
            <Palette size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-bq-text text-base hidden sm:block group-hover:text-bq-accent transition-colors">
            BrushQuest <span className="text-bq-accent">AI</span>
          </span>
        </button>

        {/* Right stats cluster */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Streak Flame */}
          <div className="flex items-center gap-1.5" title={`${currentStreak}-day streak`}>
            <Flame
              size={18}
              className={`animate-streak-pulse ${currentStreak > 0 ? 'text-orange-400' : 'text-bq-muted'}`}
              fill={currentStreak > 0 ? '#fb923c' : 'none'}
            />
            <span className={`text-sm font-bold font-mono ${currentStreak > 0 ? 'text-orange-400' : 'text-bq-muted'}`}>
              {currentStreak}
            </span>
          </div>

          {/* XP Bar */}
          <XPBar totalXP={totalXP} xpToNextLevel={xpToNextLevel} xpInCurrentLevel={xpInCurrentLevel} />

          {/* Level Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bq-card border border-bq-accent/30"
            title={`Level ${level}`}
          >
            <Zap size={13} className="text-bq-accent" fill="#a855f7" />
            <span className="text-xs font-bold text-bq-accent font-mono">LVL {level}</span>
          </div>

          {/* Trophy for high XP */}
          {totalXP >= 100 && (
            <div className="hidden md:flex items-center gap-1 text-bq-gold" title="High Achiever">
              <Trophy size={16} fill="#f59e0b" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
