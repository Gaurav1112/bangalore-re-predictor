import { useState, useEffect, useRef } from "react";
import {
  api,
  type PredictionResponse,
  type ExplainResponse,
  type NewsResponse,
  type BuyerBrief,
  type ShapSignal,
} from "../lib/api";

interface Props {
  zoneH3: string;
  horizon: string;
  onClose: () => void;
}

const HORIZONS = ["1yr", "3yr", "5yr", "10yr"];

const BUY_WINDOW_LABEL: Record<string, { text: string; color: string }> = {
  now:   { text: "⚡ BUY NOW",       color: "#00D4A0" },
  "6mo": { text: "⏳ 6-MONTH WINDOW", color: "#F0A500" },
  "12mo":{ text: "⌛ 12-MONTH WINDOW",color: "#F0A500" },
  wait:  { text: "🔵 WAIT",           color: "#8898AA" },
};

const RISK_DOT: Record<0 | 1 | 2, { dots: string; color: string; label: string }> = {
  0: { dots: "●○○", color: "#00D4A0", label: "Low" },
  1: { dots: "●●○", color: "#F0A500", label: "Medium" },
  2: { dots: "●●●", color: "#FF5C5C", label: "High" },
};

export default function DeepDivePanel({ zoneH3, horizon, onClose }: Props) {
  const [pred, setPred]       = useState<PredictionResponse | null>(null);
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [news, setNews]       = useState<NewsResponse | null>(null);
  const [brief, setBrief]     = useState<BuyerBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setDisplayScore(0);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    Promise.all([
      api.predict(zoneH3),
      api.explain(zoneH3, 5),
      api.news(zoneH3, 30),
      api.brief(zoneH3),
    ]).then(([p, e, n, b]) => {
      setPred(p);
      setExplain(e);
      setNews(n);
      setBrief(b);
      animateScore(p.investment_score);
    }).catch(console.error).finally(() => setLoading(false));
  }, [zoneH3]);

  const animateScore = (target: number) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 700, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * target));
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const zoneName = pred?.zone_name ?? explain?.zone_name ?? zoneH3;

  // Budget calc
  const budgetTotal = brief
    ? Math.round(
        (brief.min_budget_sqft * brief.typical_size_sqft) *
        (1 + brief.stamp_duty_pct / 100) + 30000
      )
    : null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* ── Header ─────────────────────────────────── */}
        <div style={styles.panelHeader}>
          <div>
            <div style={styles.zoneName}>{zoneName}</div>
            {pred && (
              <div style={styles.currentPrice}>
                ₹{pred.current_price_sqft.toLocaleString("en-IN")}/sqft · current market
              </div>
            )}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <div style={styles.loadingState}>Loading zone intelligence…</div>
        ) : (
          <div style={styles.scrollContent}>

            {/* ── BUYER'S BRIEF ────────────────────────── */}
            {brief && (
              <div style={styles.briefSection}>
                <div style={styles.sectionLabel}>BUYER'S BRIEF</div>

                {/* Buy window + property type */}
                <div style={styles.briefTopRow}>
                  <div style={styles.briefBlock}>
                    <div style={styles.briefBlockLabel}>PROPERTY TYPE</div>
                    <div style={styles.briefBlockValue}>
                      {brief.property_types.map((t, i) => (
                        <div key={i} style={{ color: "#F0F4FF", fontSize: 12, lineHeight: 1.5 }}>{t}</div>
                      ))}
                    </div>
                  </div>
                  <div style={styles.briefBlock}>
                    <div style={styles.briefBlockLabel}>TIMING</div>
                    <div style={{
                      ...styles.briefBlockValue,
                      color: BUY_WINDOW_LABEL[brief.buy_window].color,
                      fontWeight: 700,
                      fontSize: 13,
                    }}>
                      {BUY_WINDOW_LABEL[brief.buy_window].text}
                    </div>
                    <div style={styles.windowReason}>{brief.buy_window_reason}</div>
                  </div>
                </div>

                {/* Best for */}
                <div style={styles.bestFor}>
                  <span style={styles.bestForLabel}>BEST FOR </span>
                  {brief.best_for}
                </div>

                {/* Budget estimator */}
                {budgetTotal && (
                  <div style={styles.budgetBox}>
                    <div style={styles.briefBlockLabel}>BUDGET ESTIMATOR ({brief.typical_size_sqft} sqft)</div>
                    <div style={styles.budgetGrid}>
                      <span style={styles.budgetItem}>Base price</span>
                      <span style={styles.budgetAmt}>
                        ₹{(brief.min_budget_sqft * brief.typical_size_sqft).toLocaleString("en-IN")}
                      </span>
                      <span style={styles.budgetItem}>Stamp duty ({brief.stamp_duty_pct}%)</span>
                      <span style={styles.budgetAmt}>
                        ₹{Math.round(brief.min_budget_sqft * brief.typical_size_sqft * brief.stamp_duty_pct / 100).toLocaleString("en-IN")}
                      </span>
                      <span style={styles.budgetItem}>Registration</span>
                      <span style={styles.budgetAmt}>₹30,000</span>
                      <span style={{ ...styles.budgetItem, color: "#F0F4FF", fontWeight: 600 }}>Total (approx)</span>
                      <span style={{ ...styles.budgetAmt, color: "#F0A500", fontWeight: 700, fontSize: 14 }}>
                        ₹{(budgetTotal / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                )}

                {/* Price trend */}
                <div style={styles.trendRow}>
                  <span style={styles.briefBlockLabel}>24M PRICE TREND </span>
                  <span style={{ color: "#00D4A0", fontFamily: "Geist Mono, monospace", fontSize: 12 }}>
                    +{brief.price_24m_change_pct.toFixed(1)}%
                  </span>
                  <span style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: brief.price_momentum === "accelerating" ? "#00D4A0"
                         : brief.price_momentum === "stable" ? "#F0A500" : "#8898AA",
                  }}>
                    {brief.price_momentum === "accelerating" ? "↑ Accelerating"
                     : brief.price_momentum === "stable" ? "→ Stable" : "↓ Slowing"}
                  </span>
                </div>
              </div>
            )}

            {/* ── RISK CHECK ───────────────────────────── */}
            {brief && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>RISK CHECK</div>
                {(["flood", "legal", "infra"] as const).map((r) => {
                  const level = brief[`risk_${r}`] as 0 | 1 | 2;
                  const rd = RISK_DOT[level];
                  const noteKey = `risk_${r}_note` as keyof BuyerBrief;
                  return (
                    <div key={r} style={styles.riskRow}>
                      <span style={{ ...styles.riskDots, color: rd.color }}>{rd.dots}</span>
                      <div style={styles.riskContent}>
                        <div style={styles.riskTitle}>
                          <span style={{ textTransform: "capitalize" }}>{r} risk</span>
                          <span style={{ color: rd.color, marginLeft: 6, fontSize: 11 }}>{rd.label}</span>
                        </div>
                        <div style={styles.riskNote}>{brief[noteKey] as string}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── NEARBY ANCHORS ───────────────────────── */}
            {brief && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>NEARBY ANCHORS</div>
                {[
                  { label: "Metro",    km: brief.metro_km,    note: brief.metro_note,    icon: "🚇" },
                  { label: "Hospital", km: brief.hospital_km, note: brief.hospital_note, icon: "🏥" },
                  { label: "School",   km: brief.school_km,   note: brief.school_note,   icon: "🏫" },
                  { label: "IT Park",  km: brief.it_park_km,  note: brief.it_park_note,  icon: "🏢" },
                ].map(({ label, km, note, icon }) => (
                  <div key={label} style={styles.amenityRow}>
                    <span style={styles.amenityIcon}>{icon}</span>
                    <div style={styles.amenityContent}>
                      <div style={styles.amenityHeader}>
                        <span style={styles.amenityLabel}>{label}</span>
                        <span style={{
                          fontFamily: "Geist Mono, monospace",
                          fontSize: 12,
                          color: km <= 2 ? "#00D4A0" : km <= 5 ? "#F0A500" : "#FF5C5C",
                        }}>{km.toFixed(1)} km</span>
                      </div>
                      <div style={styles.amenityNote}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── INVESTMENT SCORE ─────────────────────── */}
            {pred && (
              <div style={styles.scoreSection}>
                <div>
                  <div style={styles.sectionLabel}>INVESTMENT SCORE</div>
                  <div style={styles.scoreRingWrap}>
                    <svg width={72} height={72} viewBox="0 0 72 72">
                      <circle cx={36} cy={36} r={30} fill="none"
                        stroke="rgba(136,152,170,0.15)" strokeWidth={5} />
                      <circle
                        cx={36} cy={36} r={30} fill="none"
                        stroke={displayScore >= 80 ? "#00D4A0" : displayScore >= 60 ? "#F0A500" : "#FF5C5C"}
                        strokeWidth={5}
                        strokeDasharray={`${(displayScore / 100) * 188.5} 188.5`}
                        strokeLinecap="round"
                        transform="rotate(-90 36 36)"
                      />
                      <text x={36} y={41} textAnchor="middle" fill="#F0F4FF"
                        fontSize={18} fontFamily="Fraunces, serif" fontWeight={700}>
                        {displayScore}
                      </text>
                    </svg>
                    <span style={{ color: "#8898AA", fontSize: 12, fontFamily: "Geist Mono, monospace" }}>/100</span>
                  </div>
                </div>
                {/* ROI bars */}
                <div style={{ flex: 1 }}>
                  <div style={styles.sectionLabel}>ROI FORECAST</div>
                  {(() => {
                    const maxRoi = Math.max(...HORIZONS.map(h => pred.predictions[h]?.roi_pct ?? 0));
                    const barScale = Math.max(30, maxRoi * 1.2);
                    return HORIZONS.map((h) => {
                      const p = pred.predictions[h];
                      if (!p) return null;
                      const pct = Math.max(0, Math.min(100, (p.roi_pct / barScale) * 100));
                      return (
                        <div key={h} style={styles.roiRow}>
                          <span style={styles.roiLabel}>{h}</span>
                          <div style={styles.roiBarTrack}>
                            <div style={{
                              ...styles.roiBarFill,
                              width: `${pct}%`,
                              background: h === horizon ? "#00D4A0" : "rgba(240,165,0,0.55)",
                            }} />
                          </div>
                          <span style={styles.roiValue}>+{p.roi_pct.toFixed(1)}%</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* ── ANALYST TAKE ─────────────────────────── */}
            {brief && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>ANALYST TAKE</div>
                <div style={styles.analystText}>{brief.analyst_take}</div>
              </div>
            )}

            {/* ── TOP SIGNALS ──────────────────────────── */}
            {explain && explain.top_signals.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>WHY THIS SCORE (TOP SIGNALS)</div>
                {explain.top_signals.map((s) => (
                  <ShapRow key={s.feature} signal={s} />
                ))}
              </div>
            )}

            {/* ── NEWS ─────────────────────────────────── */}
            {news && news.items.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>RECENT INTELLIGENCE</div>
                {news.items.slice(0, 5).map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={styles.newsItem}>
                    <span style={{
                      ...styles.newsDot,
                      background: item.sentiment > 0.5 ? "#00D4A0" : item.sentiment > 0 ? "#F0A500" : "#FF5C5C",
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
      <span style={{ color: isPos ? "#00D4A0" : "#FF5C5C", fontSize: 12, width: 14, flexShrink: 0 }}>
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
    position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none",
  },
  panel: {
    position: "absolute", top: 0, right: 0, bottom: 0, width: 400,
    background: "rgba(10,15,24,0.98)",
    backdropFilter: "blur(20px)",
    borderLeft: "1px solid rgba(240,165,0,0.18)",
    pointerEvents: "auto",
    display: "flex", flexDirection: "column",
    boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(136,152,170,0.12)",
    flexShrink: 0,
  },
  zoneName: {
    fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700,
    color: "#F0F4FF", lineHeight: 1.2,
  },
  currentPrice: {
    fontFamily: "Geist Mono, monospace", fontSize: 12,
    color: "#F0A500", marginTop: 4,
  },
  closeBtn: {
    background: "transparent", border: "1px solid rgba(136,152,170,0.2)",
    color: "#8898AA", width: 28, height: 28, borderRadius: 6,
    cursor: "pointer", fontSize: 12, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  loadingState: {
    padding: 40, color: "#8898AA", textAlign: "center",
    fontFamily: "Geist Mono, monospace", fontSize: 13,
  },
  scrollContent: {
    flex: 1, overflowY: "auto", paddingBottom: 32,
  },

  // Buyer's Brief
  briefSection: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.1)",
    background: "rgba(240,165,0,0.03)",
  },
  briefTopRow: {
    display: "flex", gap: 12, marginTop: 10, marginBottom: 12,
  },
  briefBlock: {
    flex: 1, background: "rgba(15,21,32,0.8)",
    border: "1px solid rgba(136,152,170,0.12)",
    borderRadius: 8, padding: "10px 12px",
  },
  briefBlockLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 9,
    letterSpacing: "0.1em", color: "#8898AA", marginBottom: 6,
  },
  briefBlockValue: {
    fontSize: 13, color: "#F0F4FF",
  },
  windowReason: {
    fontSize: 10, color: "#8898AA", marginTop: 4, lineHeight: 1.4,
  },
  bestFor: {
    fontSize: 12, color: "#C0CDD9", lineHeight: 1.5,
    marginBottom: 12,
  },
  bestForLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 9,
    letterSpacing: "0.1em", color: "#8898AA", marginRight: 4,
  },
  budgetBox: {
    background: "rgba(0,212,160,0.05)",
    border: "1px solid rgba(0,212,160,0.12)",
    borderRadius: 8, padding: "12px", marginBottom: 12,
  },
  budgetGrid: {
    display: "grid", gridTemplateColumns: "1fr auto",
    gap: "4px 16px", marginTop: 8,
  },
  budgetItem: {
    fontSize: 12, color: "#8898AA",
  },
  budgetAmt: {
    fontSize: 12, color: "#C0CDD9",
    fontFamily: "Geist Mono, monospace", textAlign: "right",
  },
  trendRow: {
    display: "flex", alignItems: "center", gap: 6,
  },

  // Risk
  section: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
  },
  sectionLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 9,
    letterSpacing: "0.1em", color: "#8898AA", marginBottom: 10,
  },
  riskRow: {
    display: "flex", gap: 10, marginBottom: 10,
  },
  riskDots: {
    fontFamily: "Geist Mono, monospace", fontSize: 11,
    flexShrink: 0, width: 28, letterSpacing: 1,
  },
  riskContent: { flex: 1 },
  riskTitle: {
    fontSize: 12, color: "#C0CDD9", marginBottom: 2,
  },
  riskNote: {
    fontSize: 11, color: "#8898AA", lineHeight: 1.4,
  },

  // Amenities
  amenityRow: {
    display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start",
  },
  amenityIcon: { fontSize: 14, flexShrink: 0, width: 20, textAlign: "center" },
  amenityContent: { flex: 1 },
  amenityHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 2,
  },
  amenityLabel: { fontSize: 12, color: "#C0CDD9" },
  amenityNote: { fontSize: 11, color: "#8898AA", lineHeight: 1.4 },

  // Score + ROI
  scoreSection: {
    display: "flex", gap: 16, padding: "14px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
    alignItems: "flex-start",
  },
  scoreRingWrap: {
    display: "flex", alignItems: "center", gap: 6, marginTop: 8,
  },
  roiRow: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
  },
  roiLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 11,
    color: "#8898AA", width: 28, flexShrink: 0,
  },
  roiBarTrack: {
    flex: 1, height: 4,
    background: "rgba(136,152,170,0.12)",
    borderRadius: 2, overflow: "hidden",
  },
  roiBarFill: {
    height: "100%", borderRadius: 2,
    transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
  },
  roiValue: {
    fontFamily: "Fraunces, serif", fontSize: 13,
    fontWeight: 600, color: "#F0F4FF",
    width: 52, textAlign: "right", flexShrink: 0,
  },

  // Analyst take
  analystText: {
    fontSize: 12, color: "#C0CDD9", lineHeight: 1.6,
    borderLeft: "2px solid rgba(240,165,0,0.3)",
    paddingLeft: 10,
  },

  // SHAP
  shapRow: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
  },
  shapLabel: { flex: 1, fontSize: 12, color: "#C0CDD9" },
  shapPts: { fontFamily: "Geist Mono, monospace", fontSize: 11 },

  // News
  newsItem: {
    display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10,
    textDecoration: "none", color: "inherit",
  },
  newsDot: {
    width: 6, height: 6, borderRadius: "50%",
    flexShrink: 0, marginTop: 5,
  },
  newsHeadline: {
    flex: 1, fontSize: 11, color: "#C0CDD9", lineHeight: 1.4,
  },
  newsDays: {
    fontFamily: "Geist Mono, monospace", fontSize: 10,
    color: "#8898AA", flexShrink: 0,
  },
  staleNote: {
    padding: "8px 20px", fontSize: 11, color: "#F0A500",
    fontFamily: "Geist Mono, monospace",
  },
};
