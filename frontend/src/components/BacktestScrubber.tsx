/**
 * Backtest scrubber — drag year slider to replay model predictions vs actuals.
 * Used on /backtest route.
 */

import { useState, useEffect } from "react";
import { api } from "../lib/api";

const YEARS = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

interface ZoneSample {
  zone_name: string | null;
  year: number;
  predicted_3yr_roi: number;
  actual_3yr_roi: number;
  predicted_price: number;
  actual_price: number;
}

export default function BacktestScrubber() {
  const [year, setYear] = useState(2017);
  const [allSamples, setAllSamples] = useState<ZoneSample[]>([]);
  const [folds, setFolds] = useState<{ mape: number; train_end: string }[]>([]);
  const [overallMape, setOverallMape] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.backtest().then((data: any) => {
      setFolds(data.folds ?? []);
      setAllSamples(data.zone_samples ?? []);
      setOverallMape(data.overall_mape ?? null);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const visibleSamples = allSamples.filter((s) => s.year === year);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Backtesting Proof</h1>
        <p style={styles.subtitle}>
          Model trained only on data available before each year — showing it could have
          predicted future appreciation without any hindsight.
        </p>
        {overallMape != null && (
          <div style={styles.mapeChip}>
            Overall MAPE: <strong>{overallMape.toFixed(1)}%</strong>
            {overallMape < 12 && <span style={styles.mapeGood}> ✓ beats benchmark</span>}
          </div>
        )}
      </div>

      {/* Year scrubber */}
      <div style={styles.scrubberSection}>
        <div style={styles.scrubberLabel}>
          Training cutoff: <strong>{year}</strong> — predicting 3yr ahead
        </div>
        <input
          type="range"
          min={YEARS[0]}
          max={YEARS[YEARS.length - 4]} // leave room for 3yr test window
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.yearTicks}>
          {YEARS.slice(0, -3).map((y) => (
            <span key={y} style={{ ...styles.tick, fontWeight: y === year ? 700 : 400,
              color: y === year ? "#F0A500" : "#8898AA" }}>
              {y}
            </span>
          ))}
        </div>
      </div>

      {/* Walk-forward fold MAPE chart */}
      {folds.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>WALK-FORWARD FOLD ACCURACY (MAPE %)</div>
          <div style={styles.mapeChart}>
            {folds.map((f, i) => (
              <div key={i} style={styles.mapeBar}>
                <div
                  style={{
                    ...styles.mapeBarFill,
                    // Scale: max displayable MAPE = 20 → full bar (120px)
                    height: `${Math.min(100, (f.mape / 20) * 100)}%`,
                    background: f.mape < 12 ? "#00D4A0" : "#FF5C5C",
                  }}
                />
                <span style={styles.mapeBarLabel}>{f.mape.toFixed(1)}</span>
              </div>
            ))}
            {/* 12% MAPE benchmark: 12/20 = 60% of chart height from bottom */}
            <div style={styles.benchmarkLine}>
              <span style={styles.benchmarkLabel}>12% benchmark</span>
            </div>
          </div>
        </div>
      )}

      {/* Zone-level comparison */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>ZONE PREDICTIONS ({year} → {year + 3})</div>
        {loading ? (
          <div style={styles.loading}>Loading backtest data…</div>
        ) : visibleSamples.length === 0 ? (
          <div style={styles.loading}>No data for {year} — try another year</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Zone</th>
                <th style={styles.th}>Predicted ROI</th>
                <th style={styles.th}>Actual ROI</th>
                <th style={styles.th}>Error</th>
              </tr>
            </thead>
            <tbody>
              {visibleSamples.map((s, i) => {
                const err = Math.abs(s.predicted_3yr_roi - s.actual_3yr_roi);
                return (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{s.zone_name ?? "Unknown"}</td>
                    <td style={{ ...styles.td, color: "#F0A500" }}>
                      +{s.predicted_3yr_roi.toFixed(1)}%
                    </td>
                    <td style={{ ...styles.td, color: "#00D4A0" }}>
                      +{s.actual_3yr_roi.toFixed(1)}%
                    </td>
                    <td style={{ ...styles.td, color: err < 5 ? "#00D4A0" : "#FF5C5C" }}>
                      {err.toFixed(1)}pp
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#080C14",
    color: "#F0F4FF",
    fontFamily: "DM Sans, sans-serif",
    padding: "32px 24px",
    maxWidth: 900,
    margin: "0 auto",
  },
  header: { marginBottom: 32 },
  title: {
    fontFamily: "Fraunces, serif",
    fontSize: 32,
    fontWeight: 700,
    color: "#F0A500",
    marginBottom: 8,
  },
  subtitle: { color: "#8898AA", fontSize: 14, lineHeight: 1.6, maxWidth: 600 },
  mapeChip: {
    display: "inline-block",
    marginTop: 12,
    background: "rgba(240,165,0,0.1)",
    border: "1px solid rgba(240,165,0,0.25)",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 13,
    fontFamily: "Geist Mono, monospace",
    color: "#F0A500",
  },
  mapeGood: { color: "#00D4A0" },
  scrubberSection: {
    background: "rgba(15,21,32,0.8)",
    border: "1px solid rgba(136,152,170,0.12)",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 24,
  },
  scrubberLabel: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 13,
    color: "#8898AA",
    marginBottom: 16,
  },
  slider: {
    width: "100%",
    accentColor: "#F0A500",
    cursor: "pointer",
  },
  yearTicks: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    fontFamily: "Geist Mono, monospace",
    fontSize: 11,
  },
  tick: { transition: "color 200ms" },
  section: {
    background: "rgba(15,21,32,0.8)",
    border: "1px solid rgba(136,152,170,0.12)",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "#8898AA",
    marginBottom: 16,
  },
  mapeChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    height: 120,
    position: "relative",
  },
  // Each bar column: grow from bottom using column-reverse so fill sits at bottom
  mapeBar: {
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  mapeBarFill: { width: "100%", borderRadius: "3px 3px 0 0", transition: "height 400ms", flexShrink: 0 },
  mapeBarLabel: { fontFamily: "Geist Mono, monospace", fontSize: 10, color: "#8898AA", marginBottom: 4 },
  // 12% MAPE = 12*6/120 = 60% height of 120px chart → bottom: 60%
  benchmarkLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "60%",
    borderTop: "1px dashed rgba(255,92,92,0.5)",
  },
  benchmarkLabel: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 9,
    color: "#FF5C5C",
    position: "absolute",
    right: 0,
    top: -14,
  },
  loading: { color: "#8898AA", fontFamily: "Geist Mono, monospace", fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    color: "#8898AA",
    paddingBottom: 8,
    borderBottom: "1px solid rgba(136,152,170,0.12)",
  },
  tr: { borderBottom: "1px solid rgba(136,152,170,0.06)" },
  td: { padding: "10px 0", fontSize: 13, color: "#C0CDD9" },
};
