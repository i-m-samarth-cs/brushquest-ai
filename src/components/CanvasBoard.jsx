/**
 * BrushQuest AI — Interactive HTML5 Canvas Board
 *
 * Full-featured drawing studio with:
 *  - Mouse + touch input
 *  - Brush color palette (6 artist tones + custom picker)
 *  - Brush size slider (1–30px)
 *  - Eraser mode
 *  - Clear canvas
 *  - Undo history (ImageData stack)
 *  - Reference overlay guide (SVG, toggle)
 *  - Imperatively exposes getDataURL() and clearCanvas() via ref
 */

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Eraser, Undo2, Trash2, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Predefined artist palette ────────────────────────────────────────────────
const PALETTE = [
  { color: '#1a1a2e', label: 'Deep Navy' },
  { color: '#2d2d2d', label: 'Charcoal' },
  { color: '#7c4dff', label: 'Violet' },
  { color: '#f5f0e8', label: 'Ivory' },
  { color: '#e8c97a', label: 'Raw Sienna' },
  { color: '#4a7c59', label: 'Sap Green' },
];

const CANVAS_BG = '#f8f7f4'; // warm off-white — traditional paper tone

// ─── Reference Guide SVG Overlays ────────────────────────────────────────────
function ReferenceOverlay({ guideType, width, height }) {
  if (!guideType) return null;

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;

  switch (guideType) {
    case 'circle':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.35 }}
        >
          <ellipse
            cx={cx} cy={cy}
            rx={r} ry={r * 0.97}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="8 5"
          />
          <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#6366f1" strokeWidth={1} />
          <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#6366f1" strokeWidth={1} />
          <text x={cx} y={cy - r - 12} textAnchor="middle" fontSize="11" fill="#6366f1" fontFamily="system-ui">
            Centered contour target
          </text>
        </svg>
      );

    case 'light_vector':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.4 }}
        >
          <rect x={width * 0.55} y={10} width={width * 0.42} height={height * 0.42} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" rx={6} />
          <circle cx={width * 0.78} cy={height * 0.18} r={12} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const sx = width * 0.78 + Math.cos(rad) * 17;
            const sy = height * 0.18 + Math.sin(rad) * 17;
            const ex = width * 0.78 + Math.cos(rad) * 26;
            const ey = height * 0.18 + Math.sin(rad) * 26;
            return <line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke="#f59e0b" strokeWidth={1.5} />;
          })}
          <text x={width * 0.78} y={height * 0.18 + 44} textAnchor="middle" fontSize="10" fill="#f59e0b" fontFamily="system-ui">
            Light source here
          </text>
        </svg>
      );

    case 'shading_zone':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.35 }}
        >
          {/* Full sphere circle */}
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.97} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />
          {/* Bottom-left shading zone */}
          <path
            d={`M ${cx - r * 0.15} ${cy} A ${r} ${r * 0.97} 0 0 1 ${cx - r * 0.85} ${cy + r * 0.55} A ${r} ${r * 0.97} 0 0 1 ${cx} ${cy + r * 0.97} A ${r} ${r * 0.97} 0 0 1 ${cx - r * 0.15} ${cy} Z`}
            fill="#6366f1"
            fillOpacity={0.12}
            stroke="#6366f1"
            strokeWidth={1}
          />
          <text x={cx - r * 0.55} y={cy + r * 0.55} textAnchor="middle" fontSize="10" fill="#a5b4fc" fontFamily="system-ui">
            Core shadow zone
          </text>
          {/* Light direction arrow */}
          <line x1={cx + r * 0.7} y1={cy - r * 0.7} x2={cx + r * 0.2} y2={cy - r * 0.2} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
            </marker>
          </defs>
          <text x={cx + r * 0.75} y={cy - r * 0.75} fontSize="10" fill="#f59e0b" fontFamily="system-ui">
            Light
          </text>
        </svg>
      );

    case 'horizon_line':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.4 }}
        >
          <rect x={8} y={height * 0.08} width={width - 16} height={height * 0.35} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="6 4" rx={4} />
          <text x={12} y={height * 0.08 + 16} fontSize="11" fill="#60a5fa" fontFamily="system-ui">
            Distant ridge zone (top 1/3)
          </text>
        </svg>
      );

    case 'foreground_band':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.4 }}
        >
          <rect x={8} y={height * 0.5} width={width - 16} height={height * 0.46} fill="none" stroke="#f472b6" strokeWidth={1.5} strokeDasharray="6 4" rx={4} />
          <text x={12} y={height * 0.5 + 18} fontSize="11" fill="#f472b6" fontFamily="system-ui">
            Foreground dark zone (lower half)
          </text>
        </svg>
      );

    case 'loomis_ball':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.35 }}
        >
          <ellipse cx={cx} cy={cy * 0.72} rx={r * 0.72} ry={r * 0.72} fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="6 4" />
          <text x={cx} y={cy * 0.72 - r * 0.72 - 8} textAnchor="middle" fontSize="11" fill="#a78bfa" fontFamily="system-ui">
            Cranial ball
          </text>
        </svg>
      );

    case 'loomis_guidelines':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.4 }}
        >
          <line x1={cx} y1={20} x2={cx} y2={height - 20} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={20} y1={height * 0.25} x2={width - 20} y2={height * 0.25} stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={20} y1={height * 0.50} x2={width - 20} y2={height * 0.50} stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={20} y1={height * 0.72} x2={width - 20} y2={height * 0.72} stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 4" />
          <text x={cx + 6} y={height * 0.24} fontSize="9" fill="#60a5fa" fontFamily="system-ui">Brow</text>
          <text x={cx + 6} y={height * 0.49} fontSize="9" fill="#60a5fa" fontFamily="system-ui">Nose</text>
          <text x={cx + 6} y={height * 0.71} fontSize="9" fill="#60a5fa" fontFamily="system-ui">Chin</text>
        </svg>
      );

    case 'loomis_jaw':
      return (
        <svg
          className="absolute inset-0 pointer-events-none select-none"
          width={width} height={height}
          style={{ opacity: 0.4 }}
        >
          <path
            d={`M ${cx - r * 0.65} ${cy * 0.9} Q ${cx} ${height * 0.92} ${cx + r * 0.65} ${cy * 0.9}`}
            fill="none"
            stroke="#fb923c"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text x={cx} y={height * 0.88} textAnchor="middle" fontSize="10" fill="#fb923c" fontFamily="system-ui">
            Jaw / chin plane
          </text>
        </svg>
      );

    default:
      return null;
  }
}

// ─── CanvasBoard Component ────────────────────────────────────────────────────
const CanvasBoard = forwardRef(function CanvasBoard({ lessonStep, disabled = false }, ref) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null); // stable ref to the canvas container div
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const undoStack = useRef([]); // Array of ImageData snapshots

  const [brushColor, setBrushColor] = useState('#2d2d2d');
  const [customColor, setCustomColor] = useState('#2d2d2d');
  const [brushSize, setBrushSize] = useState(8);
  const [eraserMode, setEraserMode] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 560, height: 400 });

  const MAX_UNDO = 30;

  // ── Imperative API exposed to parent via ref ──────────────────────────────
  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    },
    getCanvas: () => canvasRef.current,
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      undoStack.current = [];
    },
  }));

  // ── Initialize canvas on first mount only ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only runs once on mount

  // ── Responsive canvas sizing — preserves pixel content on resize ──────────
  useEffect(() => {
    function updateSize() {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const maxW = Math.min(wrapper.clientWidth, 700);
      const h = Math.round(maxW * 0.68);
      if (maxW < 50 || h < 50) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        setCanvasSize({ width: maxW, height: h });
        return;
      }

      // Snapshot existing pixels before resize blows away the buffer
      const prevW = canvas.width;
      const prevH = canvas.height;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = prevW;
      tempCanvas.height = prevH;
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

      // Now update size state — the canvas element's buffer will reset
      setCanvasSize({ width: maxW, height: h });

      // After the DOM update, redraw: fill background then restore content
      requestAnimationFrame(() => {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = CANVAS_BG;
        ctx.fillRect(0, 0, maxW, h);
        // Draw the saved content scaled to new dimensions
        ctx.drawImage(tempCanvas, 0, 0, prevW, prevH, 0, 0, maxW, h);
      });
    }

    // Initial call — wait one frame so the wrapper has rendered dimensions
    const raf = requestAnimationFrame(updateSize);
    window.addEventListener('resize', updateSize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // ── Push current canvas state onto the undo stack ─────────────────────────
  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO + 1), snapshot];
  }, []);

  // ── Undo last stroke ──────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    const prev = undoStack.current[undoStack.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    undoStack.current = undoStack.current.slice(0, -1);
  }, []);

  // ── Clear canvas ──────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushUndo();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [pushUndo]);

  // ── Get canvas-relative position from mouse/touch event ──────────────────
  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  // ── Drawing logic ─────────────────────────────────────────────────────────
  function startDrawing(e) {
    if (disabled) return;
    e.preventDefault();
    pushUndo();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;

    // Draw a dot on click/tap
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (brushSize / 2) * (eraserMode ? 2 : 1), 0, Math.PI * 2);
    ctx.fillStyle = eraserMode ? CANVAS_BG : brushColor;
    ctx.fill();
  }

  function draw(e) {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = eraserMode ? CANVAS_BG : brushColor;
    ctx.lineWidth = eraserMode ? brushSize * 2.5 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = eraserMode ? 'source-over' : 'source-over';
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDrawing() {
    isDrawing.current = false;
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  const activeColor = eraserMode ? '#ef4444' : brushColor;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-bq-card rounded-xl px-4 py-2.5 border border-bq-border/50">
        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {PALETTE.map(({ color, label }) => (
            <button
              key={color}
              title={label}
              onClick={() => { setBrushColor(color); setEraserMode(false); }}
              className={clsx(
                'w-6 h-6 rounded-full border-2 transition-all duration-150 hover:scale-110',
                brushColor === color && !eraserMode
                  ? 'border-white scale-110 shadow-md'
                  : 'border-transparent hover:border-white/50'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          {/* Custom color picker */}
          <label
            title="Custom color"
            className={clsx(
              'w-6 h-6 rounded-full border-2 cursor-pointer overflow-hidden transition-all duration-150 hover:scale-110 relative',
              brushColor === customColor && !eraserMode ? 'border-white scale-110' : 'border-bq-border hover:border-white/50'
            )}
            style={{ backgroundColor: customColor }}
          >
            <input
              type="color"
              value={customColor}
              onChange={e => {
                setCustomColor(e.target.value);
                setBrushColor(e.target.value);
                setEraserMode(false);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>

        <div className="h-5 w-px bg-bq-border" />

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2">
          <div
            className="rounded-full bg-bq-muted/60 flex-shrink-0"
            style={{ width: Math.max(4, brushSize / 2), height: Math.max(4, brushSize / 2) }}
          />
          <input
            type="range"
            min={1}
            max={30}
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="w-20 accent-bq-accent cursor-pointer"
            title={`Brush size: ${brushSize}px`}
          />
          <span className="text-xs text-bq-muted font-mono w-6">{brushSize}</span>
        </div>

        <div className="h-5 w-px bg-bq-border" />

        {/* Eraser */}
        <button
          onClick={() => setEraserMode(e => !e)}
          title="Eraser"
          className={clsx(
            'p-1.5 rounded-lg border transition-all',
            eraserMode
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'border-bq-border text-bq-muted hover:text-bq-text hover:border-bq-accent/50'
          )}
        >
          <Eraser size={15} />
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          title="Undo (last stroke)"
          disabled={undoStack.current.length === 0}
          className="p-1.5 rounded-lg border border-bq-border text-bq-muted hover:text-bq-text hover:border-bq-accent/50 transition-all disabled:opacity-30"
        >
          <Undo2 size={15} />
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          title="Clear canvas"
          className="p-1.5 rounded-lg border border-bq-border text-bq-muted hover:text-red-400 hover:border-red-500/50 transition-all"
        >
          <Trash2 size={15} />
        </button>

        <div className="h-5 w-px bg-bq-border" />

        {/* Reference guide toggle */}
        <button
          onClick={() => setShowGuide(v => !v)}
          title={showGuide ? 'Hide reference guide' : 'Show reference guide'}
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
            showGuide
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'border-bq-border text-bq-muted hover:border-bq-accent/50 hover:text-bq-text'
          )}
        >
          {showGuide ? <Eye size={13} /> : <EyeOff size={13} />}
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Brush cursor preview */}
        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-bq-muted">
          <div
            className="rounded-full transition-all"
            style={{
              width: Math.min(20, brushSize),
              height: Math.min(20, brushSize),
              backgroundColor: eraserMode ? '#ef4444' : activeColor,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
          <span className="font-mono">{eraserMode ? 'Eraser' : 'Brush'}</span>
        </div>
      </div>

      {/* ── Canvas Container ─────────────────────────────────────────────── */}
      <div
        ref={wrapperRef}
        className="relative rounded-xl overflow-hidden border border-bq-border/50 shadow-inner-glow w-full"
        style={{ height: canvasSize.height }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="block touch-none"
          style={{
            cursor: disabled ? 'not-allowed' : eraserMode ? 'cell' : 'crosshair',
            background: CANVAS_BG,
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Reference overlay */}
        {showGuide && lessonStep?.referenceGuide && (
          <div className="absolute inset-0 pointer-events-none">
            <ReferenceOverlay
              guideType={lessonStep.referenceGuide.type}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </div>
        )}
        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-bq-base/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <span className="text-bq-muted text-sm font-medium">Processing…</span>
          </div>
        )}
      </div>

      {/* ── Step Instructions Footer ──────────────────────────────────────── */}
      {lessonStep?.instruction && (
        <div className="bg-bq-surface/60 rounded-lg px-3 py-2 border border-bq-border/30 text-xs text-bq-muted leading-relaxed">
          <span className="text-bq-accent font-semibold">Goal: </span>
          {lessonStep.instruction}
        </div>
      )}
    </div>
  );
});

export default CanvasBoard;
