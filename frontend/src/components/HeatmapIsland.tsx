/**
 * Full-viewport heatmap with MapLibre GL + deck.gl HexagonLayer.
 * Renders as a React island (client:only="react") — MapLibre uses WebGL
 * which cannot run server-side.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { type MapRef } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { type ZoneCell, api } from "../lib/api";
import DeepDivePanel from "./DeepDivePanel";

const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946, zoom: 11 };

const HORIZONS = ["1yr", "3yr", "5yr", "10yr"] as const;
type Horizon = (typeof HORIZONS)[number];

const ROI_TO_COLOR = (roi: number): [number, number, number, number] => {
  // Cold (blue) → warm (amber) → hot (emerald) based on ROI
  if (roi < 0) return [100, 100, 200, 200];
  if (roi < 15) return [0, 102, 204, 200];
  if (roi < 30) return [240, 165, 0, 210];
  return [0, 212, 160, 220];
};

export default function HeatmapIsland() {
  const mapRef = useRef<MapRef>(null);
  const [horizon, setHorizon] = useState<Horizon>("3yr");
  const [cells, setCells] = useState<ZoneCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  const hexLayer = new HexagonLayer<ZoneCell>({
    id: "heatmap-hex",
    data: cells,
    getPosition: (d) => [d.lng, d.lat],
    getColorValue: (points) => {
      const avg = points.reduce((s, p) => s + p.predicted_roi_pct, 0) / points.length;
      return avg;
    },
    colorRange: [
      [0, 102, 204, 180],
      [80, 150, 220, 200],
      [240, 165, 0, 200],
      [255, 180, 0, 210],
      [0, 212, 160, 220],
      [0, 255, 180, 240],
    ],
    radius: 400,
    elevationScale: 50,
    extruded: false,
    pickable: true,
    onHover: (info) => {
      if (info.object) {
        const pts = info.object.points as ZoneCell[];
        setHoveredZone(pts[0] ?? null);
        setTooltipPos({ x: info.x, y: info.y });
      } else {
        setHoveredZone(null);
      }
    },
    onClick: (info) => {
      if (info.object) {
        const pts = info.object.points as ZoneCell[];
        if (pts[0]) setSelectedZone(pts[0].zone_h3);
      }
    },
    updateTriggers: { getColorValue: [horizon] },
  });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#080C14" }}>
      {/* Header bar */}
      <header style={styles.header}>
        <span style={styles.logo}>BLR INVEST</span>
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
        layers={[hexLayer]}
        initialViewState={{
          longitude: BANGALORE_CENTER.lng,
          latitude: BANGALORE_CENTER.lat,
          zoom: BANGALORE_CENTER.zoom,
          pitch: 0,
          bearing: 0,
        }}
        controller
        style={{ position: "absolute", inset: 0 }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          reuseMaps
        />
      </DeckGL>

      {/* Hover tooltip */}
      {hoveredZone && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 40,
          }}
        >
          <strong>{hoveredZone.zone_name ?? hoveredZone.zone_h3}</strong>
          <span style={{ color: "var(--accent-emerald)", marginLeft: 12 }}>
            ▲ {hoveredZone.predicted_roi_pct.toFixed(1)}% {horizon}
          </span>
          <span style={styles.scoreBadge}>{hoveredZone.investment_score}/100</span>
        </div>
      )}

      {/* Legend */}
      <div style={styles.legend}>
        <span style={{ color: "#0066CC" }}>▬</span> Low ROI
        <span style={{ color: "#F0A500", margin: "0 8px" }}>▬</span> Mid
        <span style={{ color: "#00D4A0" }}>▬</span> High
      </div>

      {/* Deep-dive panel slides in from right */}
      {selectedZone && (
        <DeepDivePanel
          zoneH3={selectedZone}
          horizon={horizon}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 20px",
    background: "rgba(8, 12, 20, 0.88)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(240,165,0,0.12)",
  },
  logo: {
    fontFamily: "var(--font-display, serif)",
    fontWeight: 700,
    fontSize: 18,
    color: "#F0A500",
    letterSpacing: "0.08em",
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
    fontFamily: "var(--font-mono, monospace)",
    fontSize: 13,
    transition: "all 200ms",
  },
  horizonActive: {
    background: "rgba(240,165,0,0.15)",
    borderColor: "#F0A500",
    color: "#F0A500",
  },
  loadingDot: {
    color: "#F0A500",
    fontSize: 10,
    animation: "pulse 1s infinite",
  },
  tooltip: {
    position: "absolute",
    zIndex: 20,
    background: "rgba(15,21,32,0.95)",
    border: "1px solid rgba(240,165,0,0.25)",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    color: "#F0F4FF",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },
  scoreBadge: {
    background: "rgba(0,212,160,0.15)",
    color: "#00D4A0",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "var(--font-mono, monospace)",
  },
  legend: {
    position: "absolute",
    bottom: 24,
    left: 20,
    zIndex: 10,
    background: "rgba(8,12,20,0.8)",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 12,
    color: "#8898AA",
    fontFamily: "var(--font-mono, monospace)",
  },
};
