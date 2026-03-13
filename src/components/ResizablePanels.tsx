import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "openfeature-editor:panel-split";
const MIN_LEFT_PX = 320;
const MIN_RIGHT_PX = 200;
const COLLAPSE_THRESHOLD_PX = 80;
const STEP = 2;
const LARGE_STEP = 10;

function loadSplit(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) {
      const n = Number(v);
      if (n >= 10 && n <= 90) return n;
    }
  } catch {}
  return 66;
}

interface Props {
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
  rightLabel: string;
}

export default function ResizablePanels({ left, right, leftLabel, rightLabel }: Props) {
  const [splitPct, setSplitPct] = useState(loadSplit);
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const preCollapseRef = useRef(splitPct);

  const saveSplit = useCallback((pct: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(pct));
    } catch {}
  }, []);

  const clampPct = useCallback((pct: number): number => {
    const container = containerRef.current;
    if (!container) return Math.max(20, Math.min(80, pct));
    const w = container.offsetWidth;
    const minLeftPct = (MIN_LEFT_PX / w) * 100;
    const minRightPct = (MIN_RIGHT_PX / w) * 100;
    return Math.max(minLeftPct, Math.min(100 - minRightPct, pct));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      setIsDragging(true);
      document.body.style.userSelect = "none";

      const onPointerMove = (ev: PointerEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const pct = (x / rect.width) * 100;

        // Check collapse threshold
        const rightPx = rect.width - (rect.width * pct) / 100;
        if (rightPx < COLLAPSE_THRESHOLD_PX) {
          setCollapsed(true);
          return;
        }

        setCollapsed(false);
        setSplitPct(clampPct(pct));
      };

      const onPointerUp = (ev: PointerEvent) => {
        target.releasePointerCapture(ev.pointerId);
        setIsDragging(false);
        document.body.style.userSelect = "";
        target.removeEventListener("pointermove", onPointerMove);
        target.removeEventListener("pointerup", onPointerUp);

        // Save final position
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const pct = (x / rect.width) * 100;
          const rightPx = rect.width - (rect.width * pct) / 100;
          if (rightPx >= COLLAPSE_THRESHOLD_PX) {
            const clamped = clampPct(pct);
            setSplitPct(clamped);
            saveSplit(clamped);
          }
        }
      };

      target.addEventListener("pointermove", onPointerMove);
      target.addEventListener("pointerup", onPointerUp);
    },
    [clampPct, saveSplit],
  );

  const handleDoubleClick = useCallback(() => {
    setCollapsed(false);
    setSplitPct(66);
    saveSplit(66);
  }, [saveSplit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newPct = splitPct;
      const step = e.shiftKey ? LARGE_STEP : STEP;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newPct = clampPct(splitPct - step);
          break;
        case "ArrowRight":
          e.preventDefault();
          newPct = clampPct(splitPct + step);
          break;
        case "Home":
          e.preventDefault();
          newPct = clampPct(20);
          break;
        case "End":
          e.preventDefault();
          newPct = clampPct(80);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (collapsed) {
            setCollapsed(false);
            setSplitPct(preCollapseRef.current);
            saveSplit(preCollapseRef.current);
          } else {
            preCollapseRef.current = splitPct;
            setCollapsed(true);
          }
          return;
        default:
          return;
      }

      setCollapsed(false);
      setSplitPct(newPct);
      saveSplit(newPct);
    },
    [splitPct, collapsed, clampPct, saveSplit],
  );

  // Store pre-collapse value when collapsing via drag
  useEffect(() => {
    if (collapsed) {
      preCollapseRef.current = splitPct;
    }
  }, [collapsed, splitPct]);

  const expand = useCallback(() => {
    setCollapsed(false);
    setSplitPct(preCollapseRef.current);
    saveSplit(preCollapseRef.current);
  }, [saveSplit]);

  return (
    <div ref={containerRef} className="flex h-dvh">
      <section
        className="min-w-0 overflow-hidden"
        style={{ width: collapsed ? "100%" : `${splitPct}%` }}
        aria-label={leftLabel}
      >
        {left}
      </section>

      {!collapsed && (
        <>
          {/* Divider */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(splitPct)}
            aria-label="Resize panels"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className={`group relative z-10 flex w-0 shrink-0 cursor-col-resize items-center justify-center focus-visible:outline-none ${
              isDragging ? "" : "transition-none"
            }`}
          >
            {/* Hit area */}
            <div className="absolute -left-1.5 -right-1.5 top-0 bottom-0" />
            {/* Visible line */}
            <div
              className={`absolute top-0 bottom-0 transition-all ${
                isDragging
                  ? "w-1 bg-emerald-500"
                  : "w-px bg-gray-800 group-hover:w-1 group-hover:bg-gray-600 group-focus-visible:w-1 group-focus-visible:bg-emerald-500 group-focus-visible:ring-2 group-focus-visible:ring-emerald-500"
              }`}
            />
            {/* Grip dots */}
            <div
              className={`relative z-10 flex flex-col gap-1 opacity-0 transition-opacity ${
                isDragging
                  ? "opacity-100"
                  : "group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              <div className="h-1 w-1 rounded-full bg-gray-400" />
              <div className="h-1 w-1 rounded-full bg-gray-400" />
              <div className="h-1 w-1 rounded-full bg-gray-400" />
            </div>
          </div>

          <aside
            className="min-w-0 overflow-hidden"
            style={{ width: `${100 - splitPct}%` }}
            aria-label={rightLabel}
          >
            {right}
          </aside>
        </>
      )}

      {collapsed && (
        <button
          onClick={expand}
          className="flex w-8 shrink-0 items-center justify-center border-l border-gray-800 bg-gray-950 text-gray-400 hover:bg-gray-900 hover:text-gray-200"
          aria-label="Expand output panel"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M10 4l-4 4 4 4" />
          </svg>
        </button>
      )}
    </div>
  );
}
