"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { advisors, partners, seedReferrals } from "@/lib/data";
import type { Referral } from "@/lib/types";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Node {
  id: string;
  label: string;
  initials: string;
  kind: "advisor" | "partner";
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number; // # closed referrals
  status: string;
}

/* ── Build graph from seed data ─────────────────────────────────────────── */
function buildGraph(referrals: Referral[], W: number, H: number) {
  const cx = W / 2;
  const cy = H / 2;

  // Nodes: advisors in inner ring, partners in outer ring
  const advNodes: Node[] = advisors.map((a, i) => {
    const angle = (i / advisors.length) * 2 * Math.PI;
    const r = Math.min(W, H) * 0.18;
    return { id: a.id, label: a.name, initials: a.initials, kind: "advisor", x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });

  // Only include partners that have referrals
  const activePartnerIds = [...new Set(referrals.map((r) => r.partnerId))];
  const activePartners = partners.filter((p) => activePartnerIds.includes(p.id));

  const prtNodes: Node[] = activePartners.map((p, i) => {
    const angle = (i / activePartners.length) * 2 * Math.PI - Math.PI / 4;
    const r = Math.min(W, H) * 0.38;
    return { id: p.id, label: p.name, initials: p.initials, kind: "partner", x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });

  // Edges: group by advisor+partner, weight = closed referrals
  const edgeMap = new Map<string, Edge>();
  for (const ref of referrals) {
    const key = `${ref.advisorId}__${ref.partnerId}`;
    const existing = edgeMap.get(key);
    if (existing) {
      if (ref.status === "closed") existing.weight++;
    } else {
      edgeMap.set(key, { source: ref.advisorId, target: ref.partnerId, weight: ref.status === "closed" ? 1 : 0, status: ref.status });
    }
  }

  return { nodes: [...advNodes, ...prtNodes], edges: [...edgeMap.values()] };
}

/* ── Force simulation (vanilla, no D3) ─────────────────────────────────── */
function runForces(nodes: Node[], edges: Edge[], W: number, H: number): Node[] {
  const cx = W / 2;
  const cy = H / 2;
  const REPULSION = 3500;
  const LINK_STRENGTH = 0.04;
  const LINK_DIST = Math.min(W, H) * 0.28;
  const GRAVITY = 0.015;
  const DAMPING = 0.82;
  const STEPS = 160;

  const ns = nodes.map((n) => ({ ...n }));

  for (let s = 0; s < STEPS; s++) {
    // Repulsion
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x || 0.01;
        const dy = ns[j].y - ns[i].y || 0.01;
        const dist2 = dx * dx + dy * dy;
        const force = REPULSION / dist2;
        const fx = (dx / Math.sqrt(dist2)) * force;
        const fy = (dy / Math.sqrt(dist2)) * force;
        ns[i].vx -= fx; ns[i].vy -= fy;
        ns[j].vx += fx; ns[j].vy += fy;
      }
    }
    // Link attraction
    for (const e of edges) {
      const si = ns.findIndex((n) => n.id === e.source);
      const ti = ns.findIndex((n) => n.id === e.target);
      if (si < 0 || ti < 0) continue;
      const dx = ns[ti].x - ns[si].x;
      const dy = ns[ti].y - ns[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = (dist - LINK_DIST) * LINK_STRENGTH;
      const fx = (dx / dist) * delta;
      const fy = (dy / dist) * delta;
      ns[si].vx += fx; ns[si].vy += fy;
      ns[ti].vx -= fx; ns[ti].vy -= fy;
    }
    // Gravity toward centre
    for (const n of ns) {
      n.vx += (cx - n.x) * GRAVITY;
      n.vy += (cy - n.y) * GRAVITY;
    }
    // Integrate + dampen + clamp
    for (const n of ns) {
      n.vx *= DAMPING; n.vy *= DAMPING;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(44, Math.min(W - 44, n.x));
      n.y = Math.max(44, Math.min(H - 44, n.y));
    }
  }

  return ns;
}

/* ── Component ──────────────────────────────────────────────────────────── */
const W = 680;
const H = 440;

export function RelationshipGraph({ referrals }: { referrals: Referral[] }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(referrals, W, H);
    const settled = runForces(n, e, W, H);
    setNodes(settled);
    setEdges(e);
  }, [referrals]);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const maxWeight = Math.max(1, ...edges.map((e) => e.weight));

  return (
    <div className="relative overflow-hidden rounded-xl border border-line" style={{ background: "var(--surface)" }}>
      {/* Legend */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: "#2dd4bf" }} />
          <span className="text-ink-soft">Advisor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: "#7F77DD" }} />
          <span className="text-ink-soft">Partner</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-5" style={{ background: "#1D9E75" }} />
          <span className="text-ink-soft">Closed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-5 border-t border-dashed" style={{ borderColor: "#8b9099" }} />
          <span className="text-ink-soft">Active</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <radialGradient id="rg-glow-adv" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rg-glow-prt" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7F77DD" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7F77DD" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Edges */}
        {edges.map((e) => {
          const s = nodeMap.get(e.source);
          const t = nodeMap.get(e.target);
          if (!s || !t) return null;
          const isClosed = e.weight > 0;
          const w = 1 + (e.weight / maxWeight) * 2.5;
          const isHovered = hovered === e.source || hovered === e.target;
          return (
            <line
              key={`${e.source}-${e.target}`}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              strokeWidth={isHovered ? w + 1 : w}
              stroke={isClosed ? "#1D9E75" : "#334155"}
              strokeDasharray={isClosed ? undefined : "4 4"}
              strokeOpacity={isHovered ? 0.9 : isClosed ? 0.55 : 0.3}
              style={{ transition: "stroke-opacity 0.15s" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const isAdv = n.kind === "advisor";
          const color = isAdv ? "#2dd4bf" : "#7F77DD";
          const r = isAdv ? 22 : 18;
          const isHov = hovered === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Glow */}
              {isHov && (
                <circle r={r + 14} fill={`url(#rg-glow-${isAdv ? "adv" : "prt"})`} />
              )}
              {/* Ring */}
              <circle r={r + 3} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={isHov ? 0.6 : 0.2} />
              {/* Body */}
              <circle r={r} fill={isAdv ? "rgba(45,212,191,0.12)" : "rgba(127,119,221,0.12)"}
                      stroke={color} strokeWidth={isHov ? 2 : 1.5} />
              {/* Initials */}
              <text textAnchor="middle" dominantBaseline="central"
                    fontSize={isAdv ? 10 : 8} fontWeight="700" fill={color} fontFamily="system-ui">
                {n.initials}
              </text>
              {/* Label */}
              <text textAnchor="middle" y={r + 13} fontSize={9} fill="#8b9099" fontFamily="system-ui"
                    style={{ pointerEvents: "none" }}>
                {n.label.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
