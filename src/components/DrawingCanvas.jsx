import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Sparkles, Undo2, PencilLine, Trash2 } from "lucide-react";

const CANVAS_W = 1200;
const CANVAS_H = 700;
const BG = "#ffffff";
const MAX_UNDO = 10;

const SWATCHES = [
  "#111111", "#6b7280", "#b91c1c", "#ea580c", "#f2c029", "#84cc16",
  "#15803d", "#0d9488", "#0ea5e9", "#1d4ed8", "#6d28d9", "#db2777",
  "#e8b48c", "#7c3f1d",
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Stamps one dab. Hardness drives where the radial gradient stops being opaque:
 * 1 is a crisp disc, 0 fades from the centre.
 *
 * Benchmarked against a cached-sprite + drawImage version on this machine: the
 * gradient is FASTER below ~size 80 (0.48x at size 4), and both cost 1-3ms for a
 * full 1000px stroke. The sprite cache was complexity for nothing.
 */
function stamp(ctx, x, y, size, color, hardness) {
  const r = Math.max(0.5, size / 2);
  const { r: cr, g: cg, b: cb } = hexToRgb(color);
  const solid = `rgba(${cr},${cg},${cb},1)`;
  const core = Math.min(0.999, Math.max(0, hardness));

  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, solid);
  grad.addColorStop(core, solid);
  grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export default function DrawingCanvas({ onExport }) {
  const canvasRef = useRef(null);
  const strokeRef = useRef(null); // visible transparent layer for the active stroke
  const pointerRef = useRef(null);
  const brushRef = useRef(null);
  const lastRef = useRef(null);
  const drawingRef = useRef(false);
  const undoRef = useRef([]);
  const queueRef = useRef([]); // points waiting for the next animation frame
  const rafRef = useRef(0);

  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(8);
  const [hardness, setHardness] = useState(0.85);
  const [opacity, setOpacity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);

  const activeColor = tool === "eraser" ? BG : color;
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Snapshot by drawImage rather than getImageData: reading pixels back forces a
  // GPU->CPU sync that stalls for tens of ms, which is felt as a hitch at the
  // start of every single stroke.
  const pushUndo = useCallback(() => {
    const snap = makeCanvas(CANVAS_W, CANVAS_H);
    snap.getContext("2d").drawImage(canvasRef.current, 0, 0);
    undoRef.current.push(snap);
    if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(prev, 0, 0);
    setCanUndo(undoRef.current.length > 0);
  }, []);

  const getPos = (e, rect) => {
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  // Pen pressure thins the stroke; mouse and touch report a flat value, so only
  // trust it for an actual stylus.
  const scaleFor = (e) => {
    if (e.pointerType !== "pen") return 1;
    const p = e.pressure > 0 ? e.pressure : 1;
    return 0.25 + 0.75 * p;
  };

  // Movement is painted once per frame, instead of inside every pointer
  // handler. A stylus can fire 120-240 events/sec; painting synchronously on each
  // one blocks the main thread and the cursor visibly falls behind the pen.
  const flush = useCallback(() => {
    rafRef.current = 0;
    const pts = queueRef.current;
    if (!pts.length) return;
    queueRef.current = [];

    const ctx = strokeRef.current.getContext("2d");
    const { size, color, hardness } = brushRef.current;
    for (const pt of pts) {
      const last = lastRef.current || pt;
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      const dist = Math.hypot(dx, dy);
      const brush = size * pt.scale;
      const step = Math.max(1, brush * 0.15);
      const n = Math.min(400, Math.max(1, Math.ceil(dist / step)));

      for (let i = 1; i <= n; i++) {
        stamp(ctx, last.x + (dx * i) / n, last.y + (dy * i) / n, brush, color, hardness);
      }
      lastRef.current = pt;
    }
  }, []);

  const schedule = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const startDrawing = (e) => {
    if (drawingRef.current || e.button !== 0) return;
    e.preventDefault();
    pointerRef.current = e.pointerId;
    brushRef.current = { size, color: activeColor, hardness, opacity };
    strokeRef.current.style.opacity = opacity;
    // Throws NotFoundError if the pointer is no longer active; a failed capture
    // should not cost the user the stroke.
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is an optimisation, not a requirement */
    }
    pushUndo();

    strokeRef.current.getContext("2d").clearRect(0, 0, CANVAS_W, CANVAS_H);
    const p = getPos(e, canvasRef.current.getBoundingClientRect());
    p.scale = scaleFor(e);
    stamp(strokeRef.current.getContext("2d"), p.x, p.y, size * p.scale, activeColor, hardness);
    lastRef.current = p;
    queueRef.current = [];
    drawingRef.current = true;
  };

  const draw = (e) => {
    if (!drawingRef.current || e.pointerId !== pointerRef.current) return;
    e.preventDefault();

    // Coalesced events recover the points the browser batched away, which keeps
    // a fast stroke from turning into straight segments. It can hand back an
    // empty list, though, and [] is truthy — falling through to it drops the stroke.
    const coalesced = e.nativeEvent.getCoalescedEvents?.();
    const events = coalesced && coalesced.length ? coalesced : [e.nativeEvent];
    const rect = canvasRef.current.getBoundingClientRect();
    for (const ev of events) {
      const p = getPos(ev, rect);
      p.scale = scaleFor(ev.pointerType ? ev : e);
      queueRef.current.push(p);
    }
    schedule();
  };

  // Compositing the finished stroke in one pass is what makes opacity behave:
  // per-dab alpha would pile up at every overlap and darken the line.
  const stopDrawing = (e) => {
    if (!drawingRef.current || (e && e.pointerId !== pointerRef.current)) return;
    // Include the release position even when no final pointermove was delivered.
    if (e?.type === "pointerup") {
      const p = getPos(e, canvasRef.current.getBoundingClientRect());
      p.scale = queueRef.current.at(-1)?.scale ?? lastRef.current.scale;
      queueRef.current.push(p);
    }
    drawingRef.current = false;
    pointerRef.current = null;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    flush(); // never drop the tail of the stroke

    lastRef.current = null;
    const ctx = canvasRef.current.getContext("2d");
    ctx.save();
    ctx.globalAlpha = brushRef.current.opacity;
    ctx.drawImage(strokeRef.current, 0, 0);
    ctx.restore();
    strokeRef.current.getContext("2d").clearRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const clearCanvas = () => {
    pushUndo();
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const swatchRing = (hex) =>
    tool === "brush" && color.toLowerCase() === hex.toLowerCase()
      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0b10]"
      : "ring-1 ring-white/20";

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#111218] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Draw directly on Unpromptable</h3>
          <p className="text-sm text-white/60">
            Sketch an impossible form, then send it to the 3D pipeline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" /> Undo
          </button>
          <button
            onClick={clearCanvas}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" /> Clear
          </button>
          <button
            onClick={() => onExport(canvasRef.current.toDataURL("image/png"))}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" /> Generate from Sketch
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <div className="flex items-center gap-1 rounded-full border border-white/10 p-1">
          <button
            onClick={() => setTool("brush")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
              tool === "brush" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"
            }`}
          >
            <PencilLine className="h-3.5 w-3.5" /> Brush
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
              tool === "eraser" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" /> Eraser
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {SWATCHES.map((hex) => (
            <button
              key={hex}
              title={hex}
              onClick={() => {
                setColor(hex);
                setTool("brush");
              }}
              style={{ backgroundColor: hex }}
              className={`h-5 w-5 rounded-full transition hover:scale-110 ${swatchRing(hex)}`}
            />
          ))}
          <label
            title="Custom colour"
            className="ml-1 h-5 w-5 cursor-pointer overflow-hidden rounded-full ring-1 ring-white/20"
            style={{ background: "conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setTool("brush");
              }}
              className="h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs text-white/60">
          Size
          <input
            type="range"
            min="1"
            max="120"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24 accent-white"
          />
          <span className="w-7 tabular-nums text-white/40">{size}</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-white/60">
          Softness
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((1 - hardness) * 100)}
            onChange={(e) => setHardness(1 - Number(e.target.value) / 100)}
            className="w-24 accent-white"
          />
          <span className="w-8 tabular-nums text-white/40">
            {Math.round((1 - hardness) * 100)}%
          </span>
        </label>

        <label className="flex items-center gap-2 text-xs text-white/60">
          Opacity
          <input
            type="range"
            min="5"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="w-24 accent-white"
          />
          <span className="w-8 tabular-nums text-white/40">
            {Math.round(opacity * 100)}%
          </span>
        </label>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-white/35">
          <span>Preview</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white">
            <div
              style={{
                width: Math.min(34, Math.max(3, size * 0.28)),
                height: Math.min(34, Math.max(3, size * 0.28)),
                background: activeColor,
                opacity,
                filter: `blur(${(1 - hardness) * Math.min(34, size * 0.28) * 0.25}px)`,
                borderRadius: "50%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Keep the live stroke visible without copying the entire image per frame.
          Layer opacity matches the single-pass commit, including soft brushes. */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white [contain:paint]">
        <canvas
          style={{ willChange: "transform", transform: "translateZ(0)" }}
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block h-[420px] w-full"
        />
        <canvas
          ref={strokeRef}
          width={CANVAS_W}
          height={CANVAS_H}
          aria-label="Drawing surface"
          style={{ transform: "translateZ(0)" }}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onLostPointerCapture={stopDrawing}
          onPointerLeave={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) stopDrawing(e);
          }}
        />
      </div>
      <p className="text-xs text-white/45">
        Colour the sketch rather than outlining it &mdash; Meshy infers the model&rsquo;s base colour
        from what you draw, so a flat line drawing comes back grey. Pen pressure varies stroke width
        on a stylus.
      </p>
    </div>
  );
}
