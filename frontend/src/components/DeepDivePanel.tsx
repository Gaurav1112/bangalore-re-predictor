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
  onZoneSelect?: (zoneH3: string) => void;
}

const HORIZONS = ["1yr", "3yr", "5yr", "10yr"];

const BUY_WINDOW_LABEL: Record<string, { text: string; color: string }> = {
  now:   { text: "⚡ BUY NOW",        color: "#00D4A0" },
  "6mo": { text: "⏳ 6-MONTH WINDOW", color: "#F0A500" },
  "12mo":{ text: "⌛ 12-MONTH WINDOW",color: "#F0A500" },
  wait:  { text: "🔵 WAIT",           color: "#8898AA" },
};

const RISK_DOT: Record<0 | 1 | 2, { dots: string; color: string; label: string }> = {
  0: { dots: "●○○", color: "#00D4A0", label: "Low" },
  1: { dots: "●●○", color: "#F0A500", label: "Medium" },
  2: { dots: "●●●", color: "#FF5C5C", label: "High" },
};

// Karnataka stamp duty slabs (2024)
function stampDutyPct(propertyValueRs: number): number {
  if (propertyValueRs < 4500000) return 3.0;   // < ₹45L
  if (propertyValueRs < 7500000) return 5.6;   // ₹45L–₹75L
  return 6.56;                                   // > ₹75L
}

function calcEMI(principal: number, annualRatePct = 8.75, months = 240): number {
  const r = annualRatePct / 1200;
  const pwr = Math.pow(1 + r, months);
  return Math.round(principal * r * pwr / (pwr - 1));
}

function fmtRs(rs: number): string {
  if (rs >= 10000000) return `₹${(rs / 10000000).toFixed(2)}Cr`;
  if (rs >= 100000)   return `₹${(rs / 100000).toFixed(1)}L`;
  return `₹${rs.toLocaleString("en-IN")}`;
}

export default function DeepDivePanel({ zoneH3, horizon, onClose, onZoneSelect }: Props) {
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

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
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
  const isPlotFocused = brief?.property_types.every(t => t.toLowerCase().includes("plot")) ?? false;

  // Budget computations per size option
  const sizeRows = brief?.sizes.map(sz => {
    const base = brief.min_budget_sqft * sz.sqft;
    const sdPct = stampDutyPct(base);
    const stampDuty = Math.round(base * sdPct / 100);
    const registration = Math.min(Math.round(base * brief.registration_pct / 100), 150000);
    const total = base + stampDuty + registration;
    const loanAmt = Math.round(base * 0.80);
    const emi = isPlotFocused ? null : calcEMI(loanAmt);
    return { ...sz, base, sdPct, stampDuty, registration, total, loanAmt, emi };
  }) ?? [];

  // Primary size (typical_size_sqft)
  const primaryRow = sizeRows.find(r => r.sqft === brief?.typical_size_sqft) ?? sizeRows[0];
  const tdsApplicable = primaryRow && primaryRow.base > 5000000;

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
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close panel">✕</button>
        </div>

        {/* ── Simulation disclaimer ───────────────────── */}
        <div style={styles.simBanner}>
          <span style={{ marginRight: 6 }}>⚠</span>
          SIMULATION MODE — Predictions are model estimates, not financial advice.
          Always verify independently before investing.
        </div>

        {loading ? (
          <div style={styles.loadingState}>Loading zone intelligence…</div>
        ) : (
          <div style={styles.scrollContent}>

            {/* ── BUYER'S BRIEF ──────────────────────────── */}
            {brief && (
              <div style={styles.briefSection}>
                <div style={styles.sectionLabel}>BUYER'S BRIEF</div>

                {/* Property type + timing */}
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
                      fontWeight: 700, fontSize: 13,
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

                {/* Price trend */}
                <div style={{ ...styles.trendRow, marginBottom: 12 }}>
                  <span style={styles.briefBlockLabel}>24M PRICE TREND </span>
                  <span style={{ color: "#00D4A0", fontFamily: "Geist Mono, monospace", fontSize: 12 }}>
                    +{brief.price_24m_change_pct.toFixed(1)}%
                  </span>
                  <span style={{
                    marginLeft: 8, fontSize: 11,
                    color: brief.price_momentum === "accelerating" ? "#00D4A0"
                          : brief.price_momentum === "stable" ? "#F0A500" : "#8898AA",
                  }}>
                    {brief.price_momentum === "accelerating" ? "↑ Accelerating"
                     : brief.price_momentum === "stable" ? "→ Stable" : "↓ Slowing"}
                  </span>
                </div>
              </div>
            )}

            {/* ── BUDGET CALCULATOR ──────────────────────── */}
            {brief && sizeRows.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>BUDGET CALCULATOR</div>

                {/* Size options table */}
                <div style={styles.sizeTable}>
                  <div style={styles.sizeTableHead}>
                    <span>Size</span>
                    <span>Base</span>
                    <span>All-in</span>
                    {!isPlotFocused && <span>EMI/mo</span>}
                  </div>
                  {sizeRows.map(r => (
                    <div key={r.label} style={{
                      ...styles.sizeTableRow,
                      background: r.sqft === brief.typical_size_sqft
                        ? "rgba(0,212,160,0.06)" : "transparent",
                    }}>
                      <span style={{ color: "#C0CDD9", fontSize: 11 }}>
                        {r.label}
                        {r.sqft === brief.typical_size_sqft && (
                          <span style={{ color: "#00D4A0", marginLeft: 4, fontSize: 9 }}>★</span>
                        )}
                      </span>
                      <span style={styles.sizeAmt}>{fmtRs(r.base)}</span>
                      <span style={{ ...styles.sizeAmt, color: "#F0A500" }}>{fmtRs(r.total)}</span>
                      {!isPlotFocused && (
                        <span style={{ ...styles.sizeAmt, color: "#00D4A0" }}>
                          {r.emi ? fmtRs(r.emi) : "—"}
                        </span>
                      )}
                    </div>
                  ))}
                  <div style={styles.sizeTableNote}>★ Recommended size · EMI = 80% LTV @ 8.75% p.a., 20yr</div>
                </div>

                {/* Breakdown for primary size */}
                {primaryRow && (
                  <div style={styles.budgetBox}>
                    <div style={styles.briefBlockLabel}>COST BREAKDOWN — {primaryRow.label} ({primaryRow.sqft.toLocaleString()} sqft)</div>
                    <div style={styles.budgetGrid}>
                      <span style={styles.budgetItem}>Base price</span>
                      <span style={styles.budgetAmt}>{fmtRs(primaryRow.base)}</span>

                      <span style={styles.budgetItem}>Stamp duty ({primaryRow.sdPct}%)</span>
                      <span style={styles.budgetAmt}>{fmtRs(primaryRow.stampDuty)}</span>

                      <span style={styles.budgetItem}>Registration (1%, cap ₹1.5L)</span>
                      <span style={styles.budgetAmt}>{fmtRs(primaryRow.registration)}</span>

                      <span style={{ ...styles.budgetItem, color: "#F0F4FF", fontWeight: 600 }}>Total (approx)</span>
                      <span style={{ ...styles.budgetAmt, color: "#F0A500", fontWeight: 700, fontSize: 14 }}>
                        {fmtRs(primaryRow.total)}
                      </span>
                    </div>

                    {/* Additional costs note */}
                    <div style={styles.extraCostsNote}>
                      + broker fee 1–2% · {isPlotFocused ? "construction cost on completion" : "interior ₹3–8L · GST 5% if under-construction"}
                    </div>

                    {/* TDS note */}
                    {tdsApplicable && (
                      <div style={styles.tdsNote}>
                        ⚠ TDS required: deduct {fmtRs(Math.round(primaryRow.base * 0.01))} (1% of base) from payment
                        to seller. Deposit via Form 26QB before registration. (Sec 194-IA)
                      </div>
                    )}
                  </div>
                )}

                {/* Plot loan note */}
                {isPlotFocused ? (
                  <div style={styles.plotLoanNote}>
                    <div style={{ color: "#F0A500", fontWeight: 600, marginBottom: 4, fontSize: 11 }}>
                      ⚠ PLOT FINANCING
                    </div>
                    <div style={{ fontSize: 11, color: "#C0CDD9", lineHeight: 1.5 }}>
                      Most PSU banks do not offer loans for unapproved plots.
                      SBI/HDFC plot loans require BDA-approved layout (50–70% LTV, ~9.5% p.a.).
                      Budget for full or majority cash purchase for unapproved plots.
                    </div>
                  </div>
                ) : (
                  /* EMI detail for primary size */
                  primaryRow?.emi && (
                    <div style={styles.emiBox}>
                      <div style={styles.briefBlockLabel}>EMI ESTIMATE — {primaryRow.label}</div>
                      <div style={styles.emiRow}>
                        <span style={styles.emiLabel}>Loan amount (80%)</span>
                        <span style={styles.emiVal}>{fmtRs(primaryRow.loanAmt)}</span>
                      </div>
                      <div style={styles.emiRow}>
                        <span style={styles.emiLabel}>Rate (SBI home loan)</span>
                        <span style={styles.emiVal}>8.75% p.a.</span>
                      </div>
                      <div style={styles.emiRow}>
                        <span style={styles.emiLabel}>Tenure</span>
                        <span style={styles.emiVal}>20 years</span>
                      </div>
                      <div style={{ ...styles.emiRow, borderTop: "1px solid rgba(136,152,170,0.12)", paddingTop: 6, marginTop: 2 }}>
                        <span style={{ ...styles.emiLabel, color: "#F0F4FF", fontWeight: 600 }}>Monthly EMI</span>
                        <span style={{ ...styles.emiVal, color: "#00D4A0", fontWeight: 700 }}>{fmtRs(primaryRow.emi)}</span>
                      </div>
                      <div style={styles.emiNote}>
                        Eligibility guide: need gross monthly income ~{fmtRs(Math.round(primaryRow.emi / 0.4))} (FOIR 40%).
                        Rates indicative — check with your bank.
                      </div>
                    </div>
                  )
                )}

                {/* Tax note */}
                <div style={styles.taxNote}>
                  <div style={{ color: "#8898AA", fontFamily: "Geist Mono, monospace", fontSize: 9, letterSpacing: "0.08em", marginBottom: 4 }}>TAX ON EXIT</div>
                  <div style={{ fontSize: 11, color: "#C0CDD9", lineHeight: 1.5 }}>{brief.tax_note}</div>
                </div>
              </div>
            )}

            {/* ── RISK CHECK ─────────────────────────────── */}
            {brief && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>RISK CHECK</div>
                {(["flood", "legal", "infra"] as const).map((r) => {
                  const level = brief[`risk_${r}`] as 0 | 1 | 2;
                  const rd = RISK_DOT[level];
                  const noteKey = `risk_${r}_note` as keyof BuyerBrief;
                  return (
                    <div key={r} style={styles.riskRow}>
                      <span style={{ ...styles.riskDots, color: rd.color }} aria-label={`${r} risk: ${rd.label}`}>
                        {rd.dots}
                      </span>
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
                {(brief.risk_legal === 1 || brief.risk_legal === 2) && (
                  <div style={styles.legalTip}>
                    💡 Engage a Bangalore property lawyer for title due diligence — budget ₹15,000–₹30,000.
                    Title insurance available through HDFC Ergo / Tata AIG.
                  </div>
                )}
              </div>
            )}

            {/* ── DOCUMENTS TO VERIFY ────────────────────── */}
            {brief && brief.docs_checklist.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>DOCUMENTS TO VERIFY</div>
                {brief.docs_checklist.map((doc, i) => (
                  <div key={i} style={styles.docRow}>
                    <span style={styles.docCheck}>☐</span>
                    <span style={styles.docText}>{doc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── NEARBY ANCHORS ─────────────────────────── */}
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
                          fontFamily: "Geist Mono, monospace", fontSize: 12,
                          color: km <= 2 ? "#00D4A0" : km <= 5 ? "#F0A500" : "#FF5C5C",
                        }}>{km.toFixed(1)} km</span>
                      </div>
                      <div style={styles.amenityNote}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── INVESTMENT SCORE + ROI FORECAST ───────── */}
            {pred && (
              <div style={styles.scoreSection}>
                <div>
                  <div style={styles.sectionLabel}>SCORE</div>
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
                  </div>
                  <div style={styles.scoreLegend}>
                    <div><span style={{ color: "#00D4A0" }}>80+</span> High</div>
                    <div><span style={{ color: "#F0A500" }}>60–79</span> Mid</div>
                    <div><span style={{ color: "#FF5C5C" }}>&lt;60</span> Low</div>
                  </div>
                </div>

                {/* ROI bars */}
                <div style={{ flex: 1 }}>
                  <div style={styles.sectionLabel}>ROI FORECAST (gross, pre-tax)</div>
                  {(() => {
                    const maxRoi = Math.max(...HORIZONS.map(h => pred.predictions[h]?.roi_pct ?? 0));
                    const barScale = Math.max(30, maxRoi * 1.2);
                    return HORIZONS.map((h) => {
                      const p = pred.predictions[h];
                      if (!p) return null;
                      const pct = Math.max(0, Math.min(100, (p.roi_pct / barScale) * 100));
                      return (
                        <div key={h}>
                          <div style={styles.roiRow}>
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
                          {/* Confidence range */}
                          {p.price_lower && p.price_upper && (
                            <div style={styles.roiRange}>
                              ₹{p.price_lower.toLocaleString("en-IN")}–{p.price_upper.toLocaleString("en-IN")}/sqft range
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  <div style={styles.roiDisclaimer}>ROI is gross appreciation. Deduct ~20% LTCG tax on gains.</div>
                </div>
              </div>
            )}

            {/* ── ANALYST TAKE ───────────────────────────── */}
            {brief && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>ANALYST TAKE</div>
                <div style={styles.analystText}>{brief.analyst_take}</div>
              </div>
            )}

            {/* ── SIMILAR ZONES ──────────────────────────── */}
            {brief && brief.alt_zones.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>CONSIDER ALSO (similar profile, lower price)</div>
                {brief.alt_zones.map((z) => (
                  <button
                    key={z.zone_h3}
                    onClick={() => onZoneSelect?.(z.zone_h3)}
                    style={styles.altZoneBtn}
                  >
                    <div style={styles.altZoneTop}>
                      <span style={styles.altZoneName}>{z.zone_name}</span>
                      <span style={styles.altZonePrice}>₹{z.price_sqft.toLocaleString("en-IN")}/sqft</span>
                    </div>
                    <div style={styles.altZoneWhy}>{z.why}</div>
                  </button>
                ))}
              </div>
            )}

            {/* ── WHY THIS SCORE ─────────────────────────── */}
            {explain && explain.top_signals.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>WHY THIS SCORE (TOP SIGNALS)</div>
                {explain.top_signals.map((s) => (
                  <ShapRow key={s.feature} signal={s} />
                ))}
              </div>
            )}

            {/* ── RECENT INTELLIGENCE ────────────────────── */}
            {news && news.items.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>RECENT INTELLIGENCE</div>
                <div style={styles.newsSimLabel}>Simulated sample news — verify via Times of India, ET Realty, BDA notices</div>
                {news.items.slice(0, 5).map((item, i) => (
                  <div key={i} style={styles.newsItem}>
                    <span style={{
                      ...styles.newsDot,
                      background: item.sentiment > 0.5 ? "#00D4A0" : item.sentiment > 0 ? "#F0A500" : "#FF5C5C",
                    }} />
                    <span style={styles.newsHeadline}>{item.headline}</span>
                    {item.days_ago != null && (
                      <span style={styles.newsDays}>{item.days_ago}d</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── WHAT TO DO NEXT ────────────────────────── */}
            <div style={styles.ctaSection}>
              <div style={styles.sectionLabel}>WHAT TO DO NEXT</div>
              {[
                "Visit the zone physically — 2 weekday visits, check traffic + amenities",
                "Verify RERA registration at rera.karnataka.gov.in",
                "Engage a Bangalore property lawyer for title due diligence",
                "Get home loan pre-approval from HDFC / SBI / ICICI",
                "Check Karnataka guidance value at kaveri.karnataka.gov.in",
                "Verify EC (Encumbrance Certificate) at Sub-Registrar office",
              ].map((step, i) => (
                <div key={i} style={styles.ctaRow}>
                  <span style={styles.ctaNum}>{i + 1}</span>
                  <span style={styles.ctaText}>{step}</span>
                </div>
              ))}
            </div>

            {pred?.stale && (
              <div style={styles.staleNote}>⚠ Showing cached prediction</div>
            )}

            <div style={styles.disclaimer}>
              This simulation is for research and education only. Not financial advice.
              All predictions are estimates — past trends do not guarantee future returns.
              Consult a SEBI-registered investment advisor before committing funds.
            </div>
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
    position: "absolute", top: 0, right: 0, bottom: 0,
    width: "min(420px, 100vw)",
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
  simBanner: {
    padding: "8px 20px",
    background: "rgba(240,165,0,0.08)",
    borderBottom: "1px solid rgba(240,165,0,0.2)",
    fontSize: 11,
    color: "#F0A500",
    fontFamily: "Geist Mono, monospace",
    flexShrink: 0,
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
  briefBlockValue: { fontSize: 13, color: "#F0F4FF" },
  windowReason: {
    fontSize: 10, color: "#8898AA", marginTop: 4, lineHeight: 1.4,
  },
  bestFor: {
    fontSize: 12, color: "#C0CDD9", lineHeight: 1.5, marginBottom: 10,
  },
  bestForLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 9,
    letterSpacing: "0.1em", color: "#8898AA", marginRight: 4,
  },
  trendRow: {
    display: "flex", alignItems: "center", gap: 6,
  },

  // Budget section
  section: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
  },
  sectionLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 9,
    letterSpacing: "0.1em", color: "#8898AA", marginBottom: 10,
  },

  sizeTable: {
    marginBottom: 12,
  },
  sizeTableHead: {
    display: "grid", gridTemplateColumns: "1fr auto auto auto",
    gap: "0 12px",
    fontSize: 9, color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    letterSpacing: "0.08em",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1px solid rgba(136,152,170,0.1)",
  },
  sizeTableRow: {
    display: "grid", gridTemplateColumns: "1fr auto auto auto",
    gap: "0 12px",
    padding: "5px 6px",
    borderRadius: 4,
    marginBottom: 2,
  },
  sizeAmt: {
    fontFamily: "Geist Mono, monospace", fontSize: 11,
    color: "#C0CDD9", textAlign: "right" as const,
  },
  sizeTableNote: {
    fontSize: 9, color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    marginTop: 4,
  },

  budgetBox: {
    background: "rgba(0,212,160,0.04)",
    border: "1px solid rgba(0,212,160,0.1)",
    borderRadius: 8, padding: "12px", marginBottom: 10,
  },
  budgetGrid: {
    display: "grid", gridTemplateColumns: "1fr auto",
    gap: "4px 16px", marginTop: 8,
  },
  budgetItem: { fontSize: 12, color: "#8898AA" },
  budgetAmt: {
    fontSize: 12, color: "#C0CDD9",
    fontFamily: "Geist Mono, monospace", textAlign: "right" as const,
  },
  extraCostsNote: {
    fontSize: 10, color: "#8898AA", marginTop: 8, lineHeight: 1.5,
    borderTop: "1px solid rgba(136,152,170,0.08)", paddingTop: 6,
  },
  tdsNote: {
    fontSize: 10, color: "#FF5C5C", marginTop: 6, lineHeight: 1.5,
    background: "rgba(255,92,92,0.06)", borderRadius: 4, padding: "6px 8px",
  },

  plotLoanNote: {
    background: "rgba(240,165,0,0.06)",
    border: "1px solid rgba(240,165,0,0.15)",
    borderRadius: 6, padding: "10px 12px", marginBottom: 10,
  },

  emiBox: {
    background: "rgba(15,21,32,0.8)",
    border: "1px solid rgba(136,152,170,0.12)",
    borderRadius: 8, padding: "10px 12px", marginBottom: 10,
  },
  emiRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 5,
  },
  emiLabel: { fontSize: 11, color: "#8898AA" },
  emiVal:   { fontSize: 11, color: "#C0CDD9", fontFamily: "Geist Mono, monospace" },
  emiNote:  { fontSize: 10, color: "#8898AA", marginTop: 6, lineHeight: 1.4 },

  taxNote: {
    background: "rgba(136,152,170,0.04)",
    border: "1px solid rgba(136,152,170,0.1)",
    borderRadius: 6, padding: "10px 12px",
  },

  // Risk
  riskRow: { display: "flex", gap: 10, marginBottom: 10 },
  riskDots: {
    fontFamily: "Geist Mono, monospace", fontSize: 11,
    flexShrink: 0, width: 28, letterSpacing: 1,
  },
  riskContent: { flex: 1 },
  riskTitle: { fontSize: 12, color: "#C0CDD9", marginBottom: 2 },
  riskNote:  { fontSize: 11, color: "#8898AA", lineHeight: 1.4 },
  legalTip: {
    fontSize: 11, color: "#F0A500", lineHeight: 1.5,
    background: "rgba(240,165,0,0.05)",
    borderRadius: 6, padding: "8px 10px", marginTop: 6,
  },

  // Documents
  docRow: { display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" },
  docCheck: { color: "#F0A500", fontSize: 13, flexShrink: 0, lineHeight: 1.3 },
  docText:  { fontSize: 11, color: "#C0CDD9", lineHeight: 1.5 },

  // Amenities
  amenityRow: { display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  amenityIcon: { fontSize: 14, flexShrink: 0, width: 20, textAlign: "center" as const },
  amenityContent: { flex: 1 },
  amenityHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2,
  },
  amenityLabel: { fontSize: 12, color: "#C0CDD9" },
  amenityNote: { fontSize: 11, color: "#8898AA", lineHeight: 1.4 },

  // Score + ROI
  scoreSection: {
    display: "flex", gap: 16, padding: "14px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
    alignItems: "flex-start",
  },
  scoreRingWrap: { display: "flex", alignItems: "center", gap: 6, marginTop: 8 },
  scoreLegend: {
    marginTop: 6, fontSize: 10, color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    display: "flex", flexDirection: "column", gap: 2,
  },
  roiRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 2 },
  roiLabel: {
    fontFamily: "Geist Mono, monospace", fontSize: 11,
    color: "#8898AA", width: 28, flexShrink: 0,
  },
  roiBarTrack: {
    flex: 1, height: 4, background: "rgba(136,152,170,0.12)", borderRadius: 2, overflow: "hidden",
  },
  roiBarFill: {
    height: "100%", borderRadius: 2,
    transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
  },
  roiValue: {
    fontFamily: "Fraunces, serif", fontSize: 13,
    fontWeight: 600, color: "#F0F4FF", width: 52, textAlign: "right" as const, flexShrink: 0,
  },
  roiRange: {
    fontSize: 9, color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    marginBottom: 6, marginLeft: 36,
  },
  roiDisclaimer: {
    fontSize: 9, color: "#8898AA",
    fontFamily: "Geist Mono, monospace",
    marginTop: 6, lineHeight: 1.5,
  },

  // Analyst take
  analystText: {
    fontSize: 12, color: "#C0CDD9", lineHeight: 1.6,
    borderLeft: "2px solid rgba(240,165,0,0.3)",
    paddingLeft: 10,
  },

  // Alternative zones
  altZoneBtn: {
    display: "block", width: "100%", marginBottom: 8,
    background: "rgba(15,21,32,0.6)",
    border: "1px solid rgba(136,152,170,0.15)",
    borderRadius: 8, padding: "10px 12px",
    cursor: "pointer", textAlign: "left" as const,
    transition: "border-color 150ms",
  },
  altZoneTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  altZoneName: { fontSize: 12, color: "#F0F4FF", fontWeight: 600 },
  altZonePrice: { fontSize: 11, color: "#F0A500", fontFamily: "Geist Mono, monospace" },
  altZoneWhy: { fontSize: 11, color: "#8898AA", lineHeight: 1.4 },

  // SHAP
  shapRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  shapLabel: { flex: 1, fontSize: 12, color: "#C0CDD9" },
  shapPts: { fontFamily: "Geist Mono, monospace", fontSize: 11 },

  // News
  newsSimLabel: {
    fontSize: 10, color: "#8898AA", fontStyle: "italic",
    marginBottom: 8, lineHeight: 1.4,
  },
  newsItem: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  newsDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5 },
  newsHeadline: { flex: 1, fontSize: 11, color: "#C0CDD9", lineHeight: 1.4 },
  newsDays: { fontFamily: "Geist Mono, monospace", fontSize: 10, color: "#8898AA", flexShrink: 0 },

  // CTA
  ctaSection: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(136,152,170,0.08)",
    background: "rgba(0,212,160,0.02)",
  },
  ctaRow: { display: "flex", gap: 10, marginBottom: 9, alignItems: "flex-start" },
  ctaNum: {
    width: 20, height: 20, borderRadius: "50%",
    background: "rgba(0,212,160,0.12)",
    color: "#00D4A0", fontSize: 10,
    fontFamily: "Geist Mono, monospace",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  ctaText: { fontSize: 11, color: "#C0CDD9", lineHeight: 1.5 },

  staleNote: {
    padding: "8px 20px", fontSize: 11, color: "#F0A500",
    fontFamily: "Geist Mono, monospace",
  },
  disclaimer: {
    padding: "12px 20px", fontSize: 10, color: "#8898AA",
    lineHeight: 1.6, borderTop: "1px solid rgba(136,152,170,0.08)",
    fontStyle: "italic",
  },
};
