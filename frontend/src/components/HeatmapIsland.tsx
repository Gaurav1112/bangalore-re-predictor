/**
 * Full-viewport investment heatmap.
 * Uses ScatterplotLayer (circles per zone) — not HexagonLayer, which aggregates
 * nearby points and is designed for raw density data, not pre-scored zones.
 * client:only="react" because MapLibre GL uses WebGL (no SSR).
 */

import { useState, useEffect, useCallback } from "react";
import Map from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { type ZoneCell, api } from "../lib/api";
import DeepDivePanel from "./DeepDivePanel";

const BANGALORE_CENTER = { longitude: 77.5946, latitude: 12.9716, zoom: 10, pitch: 0, bearing: 0 };

const HORIZONS = ["1yr", "3yr", "5yr", "10yr"] as const;
type Horizon = (typeof HORIZONS)[number];

function roiColor(roi: number): [number, number, number, number] {
  if (roi < 20) return [0,  102, 204, 210];   // blue  — established/low-growth
  if (roi < 35) return [240, 165,  0, 220];   // amber — developing
  if (roi < 60) return [0,  212, 160, 230];   // emerald — emerging
  return              [120, 255, 200, 245];    // bright emerald — frontier
}

export default function HeatmapIsland() {
  const [horizon, setHorizon] = useState<Horizon>("3yr");
  const [cells, setCells] = useState<ZoneCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ cell: ZoneCell; x: number; y: number } | null>(null);

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

  const scatterLayer = new ScatterplotLayer<ZoneCell>({
    id: "zone-scatter",
    data: cells,
    getPosition: (d) => [d.lng, d.lat],
    getRadius: 2800,
    radiusUnits: "meters",
    getFillColor: (d) => roiColor(d.predicted_roi_pct),
    getLineColor: [255, 255, 255, 40],
    lineWidthMinPixels: 1,
    stroked: true,
    pickable: true,
    opacity: 0.85,
    updateTriggers: { getFillColor: [horizon] },
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

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#080C14" }}>
      {/* Header */}
      <header style={styles.header}>
        <span style={styles.logo}>BLR INVEST</span>
        <span style={styles.subtitle}>Bangalore Real Estate Intelligence</span>
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
        {loading && <span style={styles.loadingDot}>●</span>}
      </header>

      {/* Map */}
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

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            ...styles.tooltip,
            left: hovered.x + 14,
            top: hovered.y - 52,
          }}
        >
          <strong style={{ color: "#F0F4FF" }}>{hovered.cell.zone_name ?? hovered.cell.zone_h3}</strong>
          <span style={styles.tooltipRoi}>
            ▲ {hovered.cell.predicted_roi_pct.toFixed(1)}% {horizon}
          </span>
          <span style={styles.tooltipPrice}>
            ₹{hovered.cell.current_price_sqft.toLocaleString("en-IN")}/sqft
          </span>
          <span style={styles.scoreBadge}>{hovered.cell.investment_score}/100</span>
        </div>
      )}

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>ROI FORECAST ({horizon})</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#0066CC" }} />  &lt;20% · Established</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#F0A500" }} />  20–35% · Developing</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#00D4A0" }} />  35–60% · Emerging</div>
        <div style={styles.legendRow}><span style={{ ...styles.legendDot, background: "#78FFD0" }} />  60%+ · Frontier</div>
      </div>

      {/* Zone count */}
      <div style={styles.zoneCount}>{cells.length} zones tracked</div>

      {selected && (
        <DeepDivePanel
          zoneH3={selected}
          horizon={horizon}
          onClose={() => setSelected(null)}
        />
      )}
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
    gap: 12,
    padding: "10px 20px",
    background: "rgba(8,12,20,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(240,165,0,0.14)",
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
    color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  horizonNav: {
    display: "flex",
    gap: 4,
    marginLeft: "auto",
  },
  horizonBtn: {
    background: "transparent",
    border: "1px solid rgba(136,152,170,0.3)",
    color: "#8898AA",
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
  loadingDot: {
    color: "#F0A500",
    fontSize: 8,
  },
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
  legend: {
    position: "absolute",
    bottom: 32,
    left: 20,
    zIndex: 10,
    background: "rgba(8,12,20,0.88)",
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 12,
    color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    border: "1px solid rgba(136,152,170,0.12)",
  },
  legendTitle: {
    fontSize: 9,
    letterSpacing: "0.1em",
    color: "#8898AA",
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
    color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    border: "1px solid rgba(136,152,170,0.12)",
  },
};
