"use client";
import { useRef, useState } from "react";

const CX = 160, CY = 158, OUTER_R = 142, INNER_R = 72;
const LABEL_R = (OUTER_R + INNER_R) / 2;

function pctToAngle(pct: number) {
  return Math.PI * (1 - Math.max(0, Math.min(100, pct)) / 100);
}

function arcPt(pct: number, r: number): [number, number] {
  const a = pctToAngle(pct);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function sector(p1: number, p2: number): string {
  const cl = (v: number) => Math.max(1, Math.min(99, v));
  const [x1, y1] = arcPt(cl(p1), OUTER_R);
  const [x2, y2] = arcPt(cl(p2), OUTER_R);
  const large = Math.abs(p2 - p1) > 50 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

function pctFromPtr(svgEl: SVGSVGElement, clientX: number, clientY: number): number {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const p = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
  const dx = p.x - CX;
  const dy = CY - p.y;
  if (dy < 0) return dx >= 0 ? 99 : 1;
  const a = Math.atan2(dy, dx);
  return Math.round(Math.max(1, Math.min(99, (1 - a / Math.PI) * 100)));
}

interface SpectrumDialProps {
  left: string;
  right: string;
  color: string;
  // Clue screen: spin the zones into position
  spinZonesTo?: number;
  onSpun?: () => void;
  // Reveal screen: static zones + target line + guess needle
  showZones?: boolean;
  target?: number;
  needle?: number;
  // Guess screen: interactive draggable needle
  interactive?: boolean;
  onNeedleChange?: (v: number) => void;
}

export default function SpectrumDial({
  left, right, color,
  spinZonesTo,
  onSpun,
  showZones = false,
  target,
  needle,
  interactive = false,
  onNeedleChange,
}: SpectrumDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragNeedle, setDragNeedle] = useState(50);
  const [animCenter, setAnimCenter] = useState<number | null>(null);
  const [spun, setSpun] = useState(false);

  function doSpin() {
    if (spinZonesTo == null || spun) return;
    setSpun(true);
    const to = spinZonesTo;
    // Overshoot to the opposite side — random position in the far 15% of the dial
    const overshoot = to < 50
      ? 84 + Math.random() * 14   // target is left half → overshoot right
      : 2 + Math.random() * 14;   // target is right half → overshoot left
    const phase1 = 750;  // fast sweep to overshoot
    const phase2 = 1300; // slow ease back to target
    let t0: number | null = null;
    setAnimCenter(50);
    function step(ts: number) {
      if (!t0) t0 = ts;
      const elapsed = ts - t0;
      if (elapsed < phase1) {
        const t = elapsed / phase1;
        setAnimCenter(Math.round(50 + (overshoot - 50) * t));
      } else {
        const t = Math.min((elapsed - phase1) / phase2, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimCenter(Math.round(overshoot + (to - overshoot) * eased));
        if (t >= 1) { onSpun?.(); return; }
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function handlePointer(clientX: number, clientY: number) {
    if (!interactive || !svgRef.current) return;
    const pct = pctFromPtr(svgRef.current, clientX, clientY);
    setDragNeedle(pct);
    onNeedleChange?.(pct);
  }

  const cl = (v: number) => Math.max(1, Math.min(99, v));

  // Which center to use for zone rendering
  const zoneCenter = animCenter ?? target ?? 50;
  // Only draw zones if: animating (clue spin), or static reveal
  const drawZones = animCenter != null || showZones;

  const displayNeedle = interactive ? dragNeedle : needle;
  const showNeedle = interactive || needle != null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, padding: "0 2px" }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{left}</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{right}</span>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 320 168"
        width="100%"
        style={{ display: "block", touchAction: "none", cursor: interactive ? "crosshair" : "default" }}
        onMouseMove={(e) => { if (e.buttons === 1) handlePointer(e.clientX, e.clientY); }}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
        onTouchMove={(e) => { e.preventDefault(); handlePointer(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchStart={(e) => handlePointer(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <defs>
          <linearGradient id="spectrum-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B5CF6" />
            <stop offset="20%"  stopColor="#3B82F6" />
            <stop offset="38%"  stopColor="#06B6D4" />
            <stop offset="55%"  stopColor="#22C55E" />
            <stop offset="72%"  stopColor="#EAB308" />
            <stop offset="86%"  stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Background semicircle — rainbow gradient */}
        <path
          d={`M ${CX - OUTER_R} ${CY} A ${OUTER_R} ${OUTER_R} 0 0 1 ${CX + OUTER_R} ${CY} Z`}
          fill="url(#spectrum-grad)"
        />

        {/* Scoring zones — white overlays so rainbow shows through */}
        {drawZones && (
          <>
            <path d={sector(zoneCenter - 25, zoneCenter - 15)} fill="rgba(255,255,255,0.22)" />
            <path d={sector(zoneCenter + 15, zoneCenter + 25)} fill="rgba(255,255,255,0.22)" />
            <path d={sector(zoneCenter - 15, zoneCenter - 5)} fill="rgba(255,255,255,0.42)" />
            <path d={sector(zoneCenter + 5, zoneCenter + 15)} fill="rgba(255,255,255,0.42)" />
            <path d={sector(zoneCenter - 5, zoneCenter + 5)} fill="rgba(255,255,255,0.65)" />
          </>
        )}

        {/* Inner donut hole */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="white" />

        {/* Zone point labels */}
        {drawZones && (
          <>
            {[
              { pct: zoneCenter, pts: 4, opacity: 1 },
              { pct: cl(zoneCenter - 10), pts: 3, opacity: 0.9 },
              { pct: cl(zoneCenter + 10), pts: 3, opacity: 0.9 },
              { pct: cl(zoneCenter - 20), pts: 2, opacity: 0.75 },
              { pct: cl(zoneCenter + 20), pts: 2, opacity: 0.75 },
            ].map(({ pct, pts, opacity }, i) => {
              const [x, y] = arcPt(pct, LABEL_R);
              return (
                <text
                  key={i}
                  x={x.toFixed(1)} y={y.toFixed(1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="13" fontWeight="800"
                  fill="#222" opacity={opacity}
                >
                  {pts}
                </text>
              );
            })}
          </>
        )}

        {/* Static target line (reveal screen only) */}
        {target != null && (() => {
          const [x1, y1] = arcPt(target, INNER_R + 5);
          const [x2, y2] = arcPt(target, OUTER_R - 5);
          return (
            <line
              x1={x1.toFixed(1)} y1={y1.toFixed(1)}
              x2={x2.toFixed(1)} y2={y2.toFixed(1)}
              stroke="#222" strokeWidth="4.5" strokeLinecap="round"
            />
          );
        })()}

        {/* Needle (guess + reveal) */}
        {showNeedle && displayNeedle != null && (() => {
          const [tx, ty] = arcPt(displayNeedle, OUTER_R - 6);
          return (
            <>
              <line
                x1={CX} y1={CY - 4}
                x2={tx.toFixed(1)} y2={ty.toFixed(1)}
                stroke={color} strokeWidth="3" strokeLinecap="round"
              />
              <circle
                cx={tx.toFixed(1)} cy={ty.toFixed(1)}
                r={interactive ? 11 : 9}
                fill={color} stroke="white" strokeWidth="2.5"
              />
            </>
          );
        })()}

        {/* Center pivot */}
        <circle cx={CX} cy={CY} r="7" fill={color} />

        {/* Baseline */}
        <line
          x1={CX - OUTER_R} y1={CY}
          x2={CX + OUTER_R} y2={CY}
          stroke="#D8D5D0" strokeWidth="1.5"
        />
      </svg>

      {/* Spin button — shown before spinning */}
      {spinZonesTo != null && !spun && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <button
            onClick={doSpin}
            style={{
              padding: "10px 28px", borderRadius: 24,
              background: color, color: "white",
              fontWeight: 700, fontSize: 15,
              border: "none", cursor: "pointer",
              boxShadow: `0 2px 12px ${color}50`,
            }}
          >
            Spin ↻
          </button>
        </div>
      )}

      {/* Drag instruction */}
      {interactive && (
        <div style={{ textAlign: "center", fontSize: 11, color: "#999", marginTop: 4 }}>
          Tap or drag the dial to place your guess
        </div>
      )}
    </div>
  );
}
