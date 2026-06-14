/**
 * Deep-dive panel: slides in from the right when a zone is clicked.
 * Shows investment score, multi-horizon ROI bars, SHAP signals, and news.
 */

import { useState, useEffect, useRef } from "react";
import {
  api,
  type PredictionResponse,
  type ExplainResponse,
  type NewsResponse,
  type ShapSignal,
} from "../lib/api";

interface Props {
  zoneH3: string;
  horizon: string;
  onClose: () => void;
}

const HORIZONS = ["1yr", "3yr", "5yr", "10yr"];

export default function DeepDivePanel({ zoneH3, horizon, onClose }: Props) {
  const [pred, setPred] = useState<PredictionResponse | null>(null);
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setLoading(true);
    setDisplayScore(0);
    scoreRef.current = 0;

    Promise.all([api.predict(zoneH3), api.explain(zoneH3, 5), api.news(zoneH3, 30)])
      .then(([p, e, n]) => {
        setPred(p);
        setExplain(e);
        setNews(n);
        animateScore(p.investment_score);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [zoneH3]);

  const animateScore = (target: number) => {
    const start = performance.now();
    const duration = 750;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = Math.round(eased * target);
      setDisplayScore(current);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const zoneName = pred?.zone_name ?? explain?.zone_name ?? zoneH3;

  return (
    // overlay is pointer-transparent so the map stays interactive behind it
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.panelHeader}>
          <div>
            <div style={styles.zoneName}>{zoneName}</div>
            {pred && (
              <div style={styles.currentPrice}>
                ₹{pred.current_price_sqft.toLocaleString("en-IN")}/sqft
              </div>
            )}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <div style={styles.loadingState}>Loading intelligence…</div>
        ) : (
          <div style={styles.content}>
            {/* Investment Score Ring */}
            {pred && (
              <div style={styles.scoreSection}>
                <div style={styles.scoreLabel}>INVESTMENT SCORE</div>
                <div style={styles.scoreRing}>
                  <svg width={80} height={80} viewBox="0 0 80 80">
                    <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(136,152,170,0.15)" strokeWidth={6} />
                    <circle
                      cx={40} cy={40} r={34}
                      fill="none"
                      stroke={displayScore >= 70 ? "#00D4A0" : displayScore >= 40 ? "#F0A500" : "#FF5C5C"}
                      strokeWidth={6}
                      strokeDasharray={`${(displayScore / 100) * 213.6} 213.6`}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                      style={{ transition: "stroke-dasharray 50ms linear" }}
                    />
                    <text x={40} y={45} textAnchor="middle" fill="#F0F4FF"
                      fontSize={20} fontFamily="Fraunces, serif" fontWeight={700}>
                      {displayScore}
                    </text>
                  </svg>
                  <div style={styles.scoreOut}>/100</div>
                </div>
              </div>
            )}

            {/* ROI Forecast */}
            {pred && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>ROI FORECAST</div>
                {HORIZONS.map((h) => {
                  const p = pred.predictions[h];
                  if (!p) return null;
                  // Scale bar to 250% max so frontier zones (150%+ ROI) don't
                  // incorrectly appear to hit the ceiling at 100%
                  const pct = Math.max(0, Math.min(100, (p.roi_pct / 250) * 100));
                  return (
                    <div key={h} style={styles.roiRow}>
                      <span style={styles.roiLabel}>{h}</span>
                      <div style={styles.roiBarTrack}>
                        <div
                          style={{
                            ...styles.roiBarFill,
                            width: `${pct}%`,
                            background: h === horizon ? "#00D4A0" : "rgba(240,165,0,0.6)",
                          }}
                        />
                      </div>
                      <span style={styles.roiValue}>+{p.roi_pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SHAP Signals */}
            {explain && explain.top_signals.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>TOP SIGNALS</div>
                {explain.top_signals.map((s) => (
                  <ShapRow key={s.feature} signal={s} />
                ))}
              </div>
            )}

            {/* News */}
            {news && news.items.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>RECENT SIGNALS</div>
                {news.items.slice(0, 5).map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={styles.newsItem}>
                    <span style={{
                      ...styles.newsDot,
                      background: item.sentiment > 0 ? "#00D4A0" : item.sentiment < 0 ? "#FF5C5C" : "#8898AA",
                    }} />
                    <span style={styles.newsHeadline}>{item.headline}</span>
                    {item.days_ago != null && (
                      <span style={styles.newsDays}>{item.days_ago}d</span>
                    )}
                  </a>
                ))}
              </div>
            )}

            {pred?.stale && (
              <div style={styles.staleNote}>⚠ Showing cached prediction</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShapRow({ signal }: { signal: ShapSignal }) {
  const isPos = signal.direction === "positive";
  return (
    <div style={styles.shapRow}>
      <span style={{ color: isPos ? "#00D4A0" : "#FF5C5C", fontSize: 12, width: 14 }}>
        {isPos ? "↑" : "↓"}
      </span>
      <span style={styles.shapLabel}>{signal.label}</span>
      <span style={{ ...styles.shapPts, color: isPos ? "#00D4A0" : "#FF5C5C" }}>
        {isPos ? "+" : "-"}{signal.pts.toFixed(1)} pts
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 30,
    pointerEvents: "none",   // pass clicks to map; panel below sets its own
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 380,
    background: "rgba(10,15,24,0.98)",
    backdropFilter: "blur(20px)",
    borderLeft: "1px solid rgba(240,165,0,0.18)",
    pointerEvents: "auto",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(136,152,170,0.12)",
  },
  zoneName: {
    fontFamily: "Fraunces, serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#F0F4FF",
    lineHeight: 1.2,
  },
  currentPrice: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 13,
    color: "#F0A500",
    marginTop: 4,
  },
  closeBtn: {
    background: "transparent",
    border: "1px solid rgba(136,152,170,0.2)",
    color: "#8898AA",
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingState: {
    padding: 40,
    color: "#8898AA",
    textAlign: "center",
    fontFamily: "Geist Mono, monospace",
    fontSize: 13,
  },
  content: {
    flex: 1,
    padding: "0 0 24px",
  },
  scoreSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
  },
  scoreLabel: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "#8898AA",
    marginBottom: 8,
  },
  scoreRing: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  scoreOut: {
    fontFamily: "Geist Mono, monospace",
    color: "#8898AA",
    fontSize: 13,
  },
  section: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
  },
  sectionLabel: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "#8898AA",
    marginBottom: 12,
  },
  roiRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  roiLabel: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 12,
    color: "#8898AA",
    width: 30,
  },
  roiBarTrack: {
    flex: 1,
    height: 4,
    background: "rgba(136,152,170,0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  roiBarFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
  },
  roiValue: {
    fontFamily: "Fraunces, serif",
    fontSize: 14,
    fontWeight: 600,
    color: "#F0F4FF",
    width: 50,
    textAlign: "right",
  },
  shapRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  shapLabel: {
    flex: 1,
    fontSize: 13,
    color: "#C0CDD9",
  },
  shapPts: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 12,
  },
  newsItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
    textDecoration: "none",
    color: "inherit",
  },
  newsDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: 5,
  },
  newsHeadline: {
    flex: 1,
    fontSize: 12,
    color: "#C0CDD9",
    lineHeight: 1.4,
  },
  newsDays: {
    fontFamily: "Geist Mono, monospace",
    fontSize: 11,
    color: "#8898AA",
    flexShrink: 0,
  },
  staleNote: {
    padding: "8px 20px",
    fontSize: 11,
    color: "#F0A500",
    fontFamily: "Geist Mono, monospace",
  },
};
