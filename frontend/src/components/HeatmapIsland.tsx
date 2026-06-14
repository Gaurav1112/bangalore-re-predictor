/**
 * Full-viewport investment heatmap.
 * Uses ScatterplotLayer (circles per zone) — not HexagonLayer, which aggregates
 * nearby points and is designed for raw density data, not pre-scored zones.
 * client:only="react" because MapLibre GL uses WebGL (no SSR).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Map from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { type ZoneCell, api } from "../lib/api";
import DeepDivePanel from "./DeepDivePanel";

const BANGALORE_CENTER = { longitude: 77.5946, latitude: 12.9716, zoom: 10, pitch: 0, bearing: 0 };

const HORIZONS = ["1yr", "3yr", "5yr", "10yr"] as const;
type Horizon = (typeof HORIZONS)[number];

type BudgetFilter = "all" | "low" | "mid" | "high";
type ScoreFilter  = "all" | "70plus" | "80plus";

// Council A's top 3 picks — highlighted with a special badge
const COUNCIL_PICKS = new Set([
  "8a3d3a24dffffff", // KR Puram
  "8a3d3a315ffffff", // Thanisandra
  "8a3d3a3a1ffffff", // Devanahalli Aerospace
]);

function roiColor(roi: number): [number, number, number, number] {
  if (roi < 20) return [0,  102, 204, 210];   // blue  — established/low-growth
  if (roi < 35) return [240, 165,  0, 220];   // amber — developing
  if (roi < 60) return [0,  212, 160, 230];   // emerald — emerging
  return              [120, 255, 200, 245];    // bright emerald — frontier
}

// Whether user prefers reduced motion
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function HeatmapIsland() {
  const [horizon, setHorizon]       = useState<Horizon>("3yr");
  const [cells, setCells]           = useState<ZoneCell[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<string | null>(null);
  const [hovered, setHovered]       = useState<{ cell: ZoneCell; x: number; y: number } | null>(null);
  const [search, setSearch]         = useState("");
  const [budgetFilter, setBudget]   = useState<BudgetFilter>("all");
  const [scoreFilter, setScore]     = useState<ScoreFilter>("all");
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const reducedMotion               = usePrefersReducedMotion();
  const panelRef                    = useRef<HTMLDivElement>(null);

  // Show onboarding once
  useEffect(() => {
    const dismissed = localStorage.getItem("blr_onboard_done");
    if (!dismissed) setShowOnboard(true);
  }, []);

  const dismissOnboard = () => {
    localStorage.setItem("blr_onboard_done", "1");
    setShowOnboard(false);
    setOnboardStep(0);
  };

  const fetchHeatmap = useCallback(async (h: Horizon) => {
    setLoading(true);
    try {
      const data = await api.heatmap(h);
      setCells(data.cells);
    } catch (e) {
      console.error("Heatmap fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHeatmap(horizon); }, [horizon, fetchHeatmap]);

  // Filtered cells
  const filteredCells = cells.filter(c => {
    const nameMatch = !search || (c.zone_name ?? c.zone_h3).toLowerCase().includes(search.toLowerCase());
    const budgetMatch =
      budgetFilter === "all" ? true :
      budgetFilter === "low"  ? c.current_price_sqft < 5000 :
      budgetFilter === "mid"  ? c.current_price_sqft >= 5000 && c.current_price_sqft < 10000 :
      c.current_price_sqft >= 10000;
    const scoreMatch =
      scoreFilter === "all"    ? true :
      scoreFilter === "70plus" ? c.investment_score >= 70 :
      c.investment_score >= 80;
    return nameMatch && budgetMatch && scoreMatch;
  });

  // Search suggestions (zone names matching query, up to 5)
  const suggestions = search.trim().length > 0
    ? cells.filter(c => (c.zone_name ?? c.zone_h3).toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  const scatterLayer = new ScatterplotLayer<ZoneCell>({
    id: "zone-scatter",
    data: filteredCells,
    getPosition: (d) => [d.lng, d.lat],
    getRadius: (d) => COUNCIL_PICKS.has(d.zone_h3) ? 3200 : 2800,
    radiusUnits: "meters",
    getFillColor: (d) => roiColor(d.predicted_roi_pct),
    getLineColor: (d) => COUNCIL_PICKS.has(d.zone_h3)
      ? [255, 215, 0, 200]   // gold ring for council picks
      : [255, 255, 255, 40],
    lineWidthMinPixels: (d: ZoneCell) => COUNCIL_PICKS.has(d.zone_h3) ? 3 : 1,
    stroked: true,
    pickable: true,
    opacity: 0.85,
    updateTriggers: { getFillColor: [horizon], getRadius: [], getLineColor: [] },
    onHover: (info) => {
      if (info.object) {
        setHovered({ cell: info.object, x: info.x, y: info.y });
      } else {
        setHovered(null);
      }
    },
    onClick: (info) => {
      if (info.object) setSelected(info.object.zone_h3);
    },
  });

  const activeFilters = budgetFilter !== "all" || scoreFilter !== "all" || search !== "";

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#080C14" }}>

      {/* ── Onboarding overlay ─────────────────────── */}
      {showOnboard && (
        <div style={styles.onboardOverlay} onClick={e => e.stopPropagation()}>
          <div style={styles.onboardCard}>
            <div style={styles.onboardStep}>Step {onboardStep + 1} of 3</div>
            {onboardStep === 0 && (
              <>
                <div style={styles.onboardTitle}>Welcome to BLR Invest</div>
                <div style={styles.onboardBody}>
                  Each circle on the map is a Bangalore investment zone, coloured by predicted ROI.
                  <div style={{ marginTop: 10 }}>
                    <span style={{ color: "#0066CC" }}>●</span> Blue = Established &nbsp;
                    <span style={{ color: "#F0A500" }}>●</span> Amber = Developing &nbsp;
                    <span style={{ color: "#00D4A0" }}>●</span> Green = Emerging
                  </div>
                </div>
              </>
            )}
            {onboardStep === 1 && (
              <>
                <div style={styles.onboardTitle}>Filter by your budget</div>
                <div style={styles.onboardBody}>
                  Use the filters at the top to narrow zones by price-per-sqft or investment score.
                  The search box lets you find a specific area by name.
                  <div style={{ marginTop: 10, color: "#F0A500" }}>
                    ★ Gold-ringed zones are the top 3 picks from our 21-expert council.
                  </div>
                </div>
              </>
            )}
            {onboardStep === 2 && (
              <>
                <div style={styles.onboardTitle}>Click any zone for full analysis</div>
                <div style={styles.onboardBody}>
                  The deep-dive panel shows price history, budget calculator, risk check,
                  infrastructure pipeline, rental income, and a plain-English verdict —
                  everything you need to make an informed decision.
                </div>
              </>
            )}
            <div style={styles.onboardBtns}>
              {onboardStep < 2 ? (
                <button style={styles.onboardNext} onClick={() => setOnboardStep(s => s + 1)}>
                  Next →
                </button>
              ) : (
                <button style={styles.onboardNext} onClick={dismissOnboard}>
                  Got it — show me the map
                </button>
              )}
              <button style={styles.onboardSkip} onClick={dismissOnboard}>Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────── */}
      <header style={styles.header}>
        <span style={styles.logo}>BLR INVEST</span>
        <span style={styles.subtitle}>Bangalore Real Estate Intelligence</span>

        {/* Search box */}
        <div style={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search zone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {suggestions.length > 0 && (
            <div style={styles.suggestions}>
              {suggestions.map(c => (
                <div
                  key={c.zone_h3}
                  style={styles.suggestionItem}
                  onClick={() => {
                    setSearch(c.zone_name ?? c.zone_h3);
                    setSelected(c.zone_h3);
                  }}
                >
                  <span style={{ color: "#F0F4FF" }}>{c.zone_name ?? c.zone_h3}</span>
                  <span style={{ color: "#F0A500", fontFamily: "Geist Mono, monospace", fontSize: 10 }}>
                    ₹{c.current_price_sqft.toLocaleString("en-IN")}/sqft
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <nav style={styles.horizonNav}>
          {HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{ ...styles.horizonBtn, ...(horizon === h ? styles.horizonActive : {}) }}
            >
              {h}
            </button>
          ))}
        </nav>
        <span style={styles.demoBadge}>DEMO</span>
        {loading && <span style={styles.loadingDot}>●</span>}
      </header>

      {/* ── Filter bar ─────────────────────────────── */}
      <div style={styles.filterBar}>
        {/* Budget filter */}
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>₹/sqft</span>
          {([
            ["all",  "All"],
            ["low",  "< ₹5K"],
            ["mid",  "₹5–10K"],
            ["high", "> ₹10K"],
          ] as [BudgetFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setBudget(val)}
              style={{
                ...styles.filterBtn,
                ...(budgetFilter === val ? styles.filterActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Score filter */}
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Score</span>
          {([
            ["all",    "All"],
            ["70plus", "70+"],
            ["80plus", "80+"],
          ] as [ScoreFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setScore(val)}
              style={{
                ...styles.filterBtn,
                ...(scoreFilter === val ? styles.filterActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active filter summary */}
        {activeFilters && (
          <div style={styles.filterSummary}>
            {filteredCells.length} / {cells.length} zones
            <button
              style={styles.clearFilters}
              onClick={() => { setSearch(""); setBudget("all"); setScore("all"); }}
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Council picks legend */}
        <div style={styles.councilPick}>
          <span style={{ color: "#F0D060" }}>◎</span> Expert picks
        </div>
      </div>

      {/* ── Map ────────────────────────────────────── */}
      <DeckGL
        layers={[scatterLayer]}
        initialViewState={BANGALORE_CENTER}
        controller
        style={{ position: "absolute", inset: 0 }}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          reuseMaps
        />
      </DeckGL>

      {/* ── Hover tooltip ──────────────────────────── */}
      {hovered && !selected && (
        <div
          style={{
            ...styles.tooltip,
            left: hovered.x + 14,
            top: hovered.y - 52,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <strong style={{ color: "#F0F4FF" }}>
              {hovered.cell.zone_name ?? hovered.cell.zone_h3}
            </strong>
            {COUNCIL_PICKS.has(hovered.cell.zone_h3) && (
              <span style={styles.councilBadge}>★ EXPERT PICK</span>
            )}
          </div>
          <span style={styles.tooltipRoi}>
            ▲ {hovered.cell.predicted_roi_pct.toFixed(1)}% {horizon}
          </span>
          <span style={styles.tooltipPrice}>
            ₹{hovered.cell.current_price_sqft.toLocaleString("en-IN")}/sqft
          </span>
          <span style={styles.scoreBadge}>{hovered.cell.investment_score}/100</span>
          <span style={styles.tooltipCta}>Click for full analysis →</span>
        </div>
      )}

      {/* ── Legend ─────────────────────────────────── */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>ROI FORECAST ({horizon})</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#0066CC" }} />  &lt;20% · Established</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#F0A500" }} />  20–35% · Developing</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#00D4A0" }} />  35–60% · Emerging</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#78FFD0" }} />  60%+ · Frontier</div>
        <div style={{ ...styles.legendRow, marginTop: 6, borderTop: "1px solid rgba(136,152,170,0.15)", paddingTop: 6 }}>
          <span style={{ color: "#F0D060", fontSize: 12, marginRight: 4 }}>◎</span>
          Expert council picks
        </div>
      </div>

      {/* ── Zone count ─────────────────────────────── */}
      <div style={styles.zoneCount}>
        {activeFilters
          ? `${filteredCells.length} of ${cells.length} zones`
          : `${cells.length} zones tracked`}
      </div>

      {/* ── Deep Dive Panel ───────────────────────── */}
      {selected && (
        <div
          ref={panelRef}
          style={{
            ...styles.panelWrap,
            animation: reducedMotion ? "none" : "slideInPanel 300ms ease-out forwards",
          }}
        >
          <DeepDivePanel
            zoneH3={selected}
            horizon={horizon}
            onClose={() => setSelected(null)}
            onZoneSelect={(h3) => setSelected(h3)}
          />
        </div>
      )}

      {/* ── Keyframe styles ────────────────────────── */}
      <style>{`
        @keyframes slideInPanel {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    background: "rgba(8,12,20,0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(240,165,0,0.14)",
    flexWrap: "wrap",
  },
  logo: {
    fontFamily: "Fraunces, serif",
    fontWeight: 700,
    fontSize: 17,
    color: "#F0A500",
    letterSpacing: "0.08em",
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 11,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },

  // Search
  searchWrap: {
    position: "relative",
    flexShrink: 0,
  },
  searchInput: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(136,152,170,0.25)",
    borderRadius: 6,
    color: "#F0F4FF",
    fontFamily: "Geist Mono, monospace",
    fontSize: 12,
    padding: "5px 12px",
    outline: "none",
    width: 160,
  },
  suggestions: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0, right: 0,
    background: "rgba(12,18,28,0.98)",
    border: "1px solid rgba(240,165,0,0.2)",
    borderRadius: 6,
    zIndex: 50,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
  },
  suggestionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    fontSize: 12,
    cursor: "pointer",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
    transition: "background 100ms",
  },

  horizonNav: {
    display: "flex",
    gap: 4,
    marginLeft: "auto",
  },
  horizonBtn: {
    background: "transparent",
    border: "1px solid rgba(136,152,170,0.3)",
    color: "#9AAABB",
    padding: "4px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "Geist Mono, monospace",
    fontSize: 12,
    transition: "all 150ms",
  },
  horizonActive: {
    background: "rgba(240,165,0,0.15)",
    borderColor: "#F0A500",
    color: "#F0A500",
  },
  demoBadge: {
    fontSize: 9,
    fontFamily: "Geist Mono, monospace",
    letterSpacing: "0.1em",
    color: "#F0A500",
    background: "rgba(240,165,0,0.12)",
    border: "1px solid rgba(240,165,0,0.3)",
    borderRadius: 4,
    padding: "2px 6px",
    flexShrink: 0,
  },
  loadingDot: {
    color: "#F0A500",
    fontSize: 8,
  },

  // Filter bar
  filterBar: {
    position: "absolute",
    top: 52, left: 0, right: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 20px",
    background: "rgba(8,12,20,0.88)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(136,152,170,0.1)",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  filterLabel: {
    fontSize: 9,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
    letterSpacing: "0.1em",
    marginRight: 4,
    flexShrink: 0,
  },
  filterBtn: {
    background: "transparent",
    border: "1px solid rgba(136,152,170,0.2)",
    color: "#9AAABB",
    padding: "3px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    transition: "all 120ms",
  },
  filterActive: {
    background: "rgba(0,212,160,0.12)",
    borderColor: "#00D4A0",
    color: "#00D4A0",
  },
  filterSummary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
    fontSize: 10,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
  },
  clearFilters: {
    background: "rgba(255,92,92,0.1)",
    border: "1px solid rgba(255,92,92,0.2)",
    color: "#FF5C5C",
    padding: "2px 8px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 10,
    fontFamily: "Geist Mono, monospace",
  },
  councilPick: {
    fontSize: 10,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },

  // Tooltip
  tooltip: {
    position: "absolute",
    zIndex: 20,
    background: "rgba(12,18,28,0.97)",
    border: "1px solid rgba(240,165,0,0.28)",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    color: "#F0F4FF",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    gap: 10,
    whiteSpace: "nowrap",
    boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
    flexWrap: "wrap",
  },
  councilBadge: {
    fontSize: 9,
    color: "#F0D060",
    background: "rgba(240,208,96,0.1)",
    border: "1px solid rgba(240,208,96,0.3)",
    borderRadius: 3,
    padding: "1px 5px",
    fontFamily: "Geist Mono, monospace",
    letterSpacing: "0.06em",
  },
  tooltipRoi: {
    color: "#00D4A0",
    fontFamily: "Geist Mono, monospace",
    fontSize: 12,
  },
  tooltipPrice: {
    color: "#F0A500",
    fontFamily: "Geist Mono, monospace",
    fontSize: 11,
  },
  scoreBadge: {
    background: "rgba(0,212,160,0.15)",
    color: "#00D4A0",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "Geist Mono, monospace",
  },
  tooltipCta: {
    fontSize: 10,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
  },

  // Legend
  legend: {
    position: "absolute",
    bottom: 32,
    left: 20,
    zIndex: 10,
    background: "rgba(8,12,20,0.88)",
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 12,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
    border: "1px solid rgba(136,152,170,0.12)",
  },
  legendTitle: {
    fontSize: 9,
    letterSpacing: "0.1em",
    color: "#9AAABB",
    marginBottom: 8,
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
    fontSize: 11,
  },
  legendDot: {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  zoneCount: {
    position: "absolute",
    bottom: 32,
    right: 20,
    zIndex: 10,
    background: "rgba(8,12,20,0.88)",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 11,
    color: "#9AAABB",
    fontFamily: "Geist Mono, monospace",
    border: "1px solid rgba(136,152,170,0.12)",
  },

  // Panel wrapper (for animation)
  panelWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 30,
    pointerEvents: "none",
  },

  // Onboarding
  onboardOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  onboardCard: {
    background: "rgba(12,18,28,0.99)",
    border: "1px solid rgba(240,165,0,0.3)",
    borderRadius: 12,
    padding: "32px 36px",
    maxWidth: 420,
    width: "90vw",
    boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
  },
  onboardStep: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    color: "#9AAABB",
    letterSpacing: "0.1em",
    marginBottom: 12,
  },
  onboardTitle: {
    fontFamily: "Fraunces, serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#F0F4FF",
    marginBottom: 12,
    lineHeight: 1.3,
  },
  onboardBody: {
    fontSize: 14,
    color: "#C0CDD9",
    lineHeight: 1.6,
    marginBottom: 24,
  },
  onboardBtns: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  onboardNext: {
    background: "#F0A500",
    border: "none",
    color: "#080C14",
    fontFamily: "Geist Mono, monospace",
    fontSize: 13,
    fontWeight: 700,
    padding: "10px 24px",
    borderRadius: 6,
    cursor: "pointer",
  },
  onboardSkip: {
    background: "transparent",
    border: "none",
    color: "#9AAABB",
    fontSize: 12,
    fontFamily: "Geist Mono, monospace",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
