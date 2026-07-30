/**
 * BrushQuest AI — Root App
 *
 * Manages top-level routing between the Roadmap and Studio views.
 * Handles global progress state + propagates updates down.
 */

import { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import BackgroundEffects from './components/BackgroundEffects.jsx';
import RoadmapView from './components/RoadmapView.jsx';
import StudioView from './components/StudioView.jsx';
import CourseStats from './components/CourseStats.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import { getProgress, setInitialState } from './utils/storage.js';
import { fetchProgress } from './services/api.js';

// ─── View Constants ────────────────────────────────────────────────────────────
const VIEW_ROADMAP = 'roadmap';
const VIEW_STUDIO = 'studio';

export default function App({ onFirstRender }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [view, setView] = useState(VIEW_ROADMAP);
  const [activeStep, setActiveStep] = useState(null);
  const [progress, setProgress] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Signal first render complete → reveals #root (FOUC guard)
  useEffect(() => {
    if (onFirstRender) onFirstRender();
  }, [onFirstRender]);

  // Refresh progress from memory on window focus (multi-tab safety reduced since memory-based)
  useEffect(() => {
    function handleFocus() {
      if (user) {
        setProgress(getProgress());
      }
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const handleAuthSuccess = async (userData) => {
    setIsInitializing(true);
    setUser(userData);
    try {
      const serverProgress = await fetchProgress(userData.id);
      const initializedState = setInitialState(userData.id, serverProgress);
      setProgress(initializedState);
    } catch (e) {
      console.error('Failed to fetch progress', e);
      // fallback to initial default
      setProgress(setInitialState(userData.id, null));
    } finally {
      setIsInitializing(false);
    }
  };



  // ── Navigate to studio for a given step ───────────────────────────────────
  const handleSelectStep = useCallback((step) => {
    setActiveStep(step);
    setView(VIEW_STUDIO);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Return to roadmap ─────────────────────────────────────────────────────
  const handleBackToRoadmap = useCallback(() => {
    setView(VIEW_ROADMAP);
    setActiveStep(null);
    // Refresh progress
    setProgress(getProgress());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Progress update callback from StudioView ──────────────────────────────
  const handleProgressUpdate = useCallback((updatedState) => {
    setProgress(updatedState);
  }, []);

  if (!user || isInitializing || !progress) {
    return (
      <>
        <BackgroundEffects />
        {isInitializing ? (
          <div className="min-h-screen flex items-center justify-center bg-bq-base text-bq-text relative">
            Loading your art studio...
          </div>
        ) : (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-bq-base text-bq-text font-sans relative">
      {/* Ambient background */}
      <BackgroundEffects />

      {/* Top navigation */}
      <Navbar
        progress={progress}
        onLogoClick={handleBackToRoadmap}
      />

      {/* Main content — offset for fixed navbar */}
      <div className="relative z-10 pt-14 flex min-h-screen">
        {/* Main view area */}
        <main className="flex-1 min-w-0">
          {view === VIEW_ROADMAP && (
            <div className="flex gap-6">
              {/* Roadmap */}
              <div className="flex-1 min-w-0">
                <RoadmapView
                  progress={progress}
                  onSelectStep={handleSelectStep}
                />
              </div>

              {/* Stats sidebar — desktop only */}
              <aside className="hidden lg:block w-72 flex-shrink-0 py-6 pr-4">
                <div className="sticky top-20">
                  <div className="bg-bq-card/80 backdrop-blur-sm rounded-2xl border border-bq-border/50 p-5">
                    <CourseStats progress={progress} />
                  </div>


                </div>
              </aside>
            </div>
          )}

          {view === VIEW_STUDIO && activeStep && (
            <StudioView
              initialStep={activeStep}
              progress={progress}
              onBack={handleBackToRoadmap}
              onProgressUpdate={handleProgressUpdate}
            />
          )}
        </main>
      </div>

      {/* Mobile stats drawer button */}
      {view === VIEW_ROADMAP && (
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="fixed bottom-6 right-4 lg:hidden z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bq-card border border-bq-border shadow-xl text-sm font-semibold text-bq-text backdrop-blur-md"
        >
          📊 Stats
        </button>
      )}

      {/* Mobile stats sheet */}
      {sidebarOpen && view === VIEW_ROADMAP && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative bg-bq-card border-t border-bq-border rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-bq-border mx-auto mb-5" />
            <CourseStats progress={progress} />
          </div>
        </div>
      )}
    </div>
  );
}
