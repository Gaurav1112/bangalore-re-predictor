import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async ({ url }) => {
  const zoneH3 = url.searchParams.get("zone_h3") ?? "";

  try {
    const res = await fetch(`${ML_API}/brief/${zoneH3}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    const brief = ZONE_BRIEF[zoneH3] ?? categoryBrief(zoneH3);
    return new Response(JSON.stringify({ zone_h3: zoneH3, ...brief }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

function categoryBrief(zoneH3: string) {
  const cat = ZONE_CATEGORY[zoneH3] ?? "frontier_north";
  return CATEGORY_BRIEF[cat];
}

const ZONE_CATEGORY: Record<string, string> = {
  "8a3d3a119ffffff": "premium",       "8a3d3a2a9ffffff": "premium",
  "8a3d3a141ffffff": "premium_trad",  "8a3d3a145ffffff": "premium_trad",
  "8a3d3a127ffffff": "tech_est",      "8a3d3a2d9ffffff": "tech_est",
  "8a3d3a2c9ffffff": "tech_est",      "8a3d3a28dffffff": "tech_est",
  "8a3d3a24dffffff": "tech_est",
  "8a3d3a117ffffff": "south_it",      "8a3d3a109ffffff": "south_it",
  "8a3d3a14dffffff": "west_mid",      "8a3d3a0d1ffffff": "west_mid",
  "8a3d3a301ffffff": "airport_north", "8a3d3a311ffffff": "airport_north",
  "8a3d3a315ffffff": "airport_north", "8a3d3a319ffffff": "airport_north",
  "8a3d3a31dffffff": "airport_north",
  "8a3d3a2bdffffff": "east_emrg",    "8a3d3a2a1ffffff": "east_emrg",
  "8a3d3a2ddffffff": "east_emrg",    "8a3d3a2e1ffffff": "east_emrg",
  "8a3d3a12dffffff": "south_emrg",   "8a3d3a121ffffff": "south_emrg",
  "8a3d3a2baffffff": "south_emrg",
  "8a3d3a3b1ffffff": "frontier_north","8a3d3a3a1ffffff": "frontier_north",
  "8a3d3a351ffffff": "frontier_north","8a3d3a3d1ffffff": "frontier_north",
  "8a3d3a3e1ffffff": "frontier_north",
  "8a3d3a069ffffff": "frontier_west", "8a3d3a059ffffff": "frontier_west",
  "8a3d3a041ffffff": "frontier_west", "8a3d3a051ffffff": "frontier_west",
  "8a3d3a35dffffff": "west_mid",
};

interface BuyerBrief {
  property_types: string[];
  best_for: string;
  buy_window: "now" | "6mo" | "12mo" | "wait";
  buy_window_reason: string;
  min_budget_sqft: number;
  typical_size_sqft: number;
  stamp_duty_pct: number;
  price_24m_change_pct: number;
  price_momentum: "accelerating" | "stable" | "slowing";
  risk_flood: 0 | 1 | 2;
  risk_legal: 0 | 1 | 2;
  risk_infra: 0 | 1 | 2;
  risk_flood_note: string;
  risk_legal_note: string;
  risk_infra_note: string;
  metro_km: number;
  metro_note: string;
  hospital_km: number;
  hospital_note: string;
  school_km: number;
  school_note: string;
  it_park_km: number;
  it_park_note: string;
  analyst_take: string;
}

const CATEGORY_BRIEF: Record<string, BuyerBrief> = {
  premium: {
    property_types: ["2BHK / 3BHK Flat", "Luxury Apartment"],
    best_for: "Capital preservation + moderate appreciation",
    buy_window: "wait",
    buy_window_reason: "Price already fully discovered. Better value 5–8km out on same corridors.",
    min_budget_sqft: 14000, typical_size_sqft: 1200, stamp_duty_pct: 5.6,
    price_24m_change_pct: 18.4, price_momentum: "stable",
    risk_flood: 1, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Some low-lying pockets near storm-water drains. Check specific layout.",
    risk_legal_note: "High RERA density. 95%+ projects registered. Low encumbrance risk.",
    risk_infra_note: "Fully developed. No execution dependency.",
    metro_km: 0.9, metro_note: "Purple/Green Line station within 1km",
    hospital_km: 1.4, hospital_note: "Fortis / Manipal within 1.5km",
    school_km: 0.6, school_note: "Multiple top schools within 700m",
    it_park_km: 2.1, it_park_note: "Embassy GolfLinks / Manyata 2km",
    analyst_take: "Premium core is fully priced. Buy here only if workplace is nearby. For growth, look at Sarjapur, HSR, or Hebbal.",
  },
  premium_trad: {
    property_types: ["2BHK / 3BHK Flat", "Independent House", "Row House"],
    best_for: "Family living with stable appreciation",
    buy_window: "6mo",
    buy_window_reason: "Metro Phase 2 pricing starting to get in. Still a 6-month window before institutions arrive.",
    min_budget_sqft: 12000, typical_size_sqft: 1400, stamp_duty_pct: 5.6,
    price_24m_change_pct: 21.2, price_momentum: "stable",
    risk_flood: 0, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Low-lying risk areas mapped out. Stick to layouts above 900m elevation.",
    risk_legal_note: "RERA compliance very high. Established layouts, minimal encumbrance risk.",
    risk_infra_note: "Fully developed. No execution dependency.",
    metro_km: 1.2, metro_note: "Green/Purple Line station under 1.5km",
    hospital_km: 1.8, hospital_note: "Jayadeva / Columbia Asia within 2km",
    school_km: 0.5, school_note: "Strong school cluster — NPS, DPS, Vidyashilp within 600m",
    it_park_km: 3.8, it_park_note: "Manyata / Embassy via ORR ~4km",
    analyst_take: "Best in class for families. Schools, green cover, metro access. Appreciation is stable not explosive — ideal for own use with 10yr horizon.",
  },
  tech_est: {
    property_types: ["2BHK / 3BHK Flat", "Villa", "Row House"],
    best_for: "Tech professionals — live near work, strong ROI",
    buy_window: "now",
    buy_window_reason: "Metro operational or arriving within 12 months. Pre-metro pricing still available in pockets.",
    min_budget_sqft: 8500, typical_size_sqft: 1300, stamp_duty_pct: 5.6,
    price_24m_change_pct: 27.8, price_momentum: "accelerating",
    risk_flood: 1, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Lake adjacency risk in some pockets (Varthur, Bellandur). Ask builder for BDA drainage clearance.",
    risk_legal_note: "RERA compliance high. Large townships have clear titles.",
    risk_infra_note: "Metro operational or < 12 months away. Low execution risk.",
    metro_km: 1.1, metro_note: "Purple Line Phase 2 operational or < 1yr away",
    hospital_km: 2.8, hospital_note: "Narayana / Sakra / Manipal within 3km",
    school_km: 1.2, school_note: "International schools (Greenwood, Inventure) within 1.5km",
    it_park_km: 0.8, it_park_note: "Direct IT park access — Prestige Tech Park / RMZ Ecoworld < 1km",
    analyst_take: "Sweet spot zone. IT park walkability + metro arriving = dual demand driver. Buy flat now; 3yr ROI fully justified by employment density.",
  },
  south_it: {
    property_types: ["2BHK Flat", "1BHK Flat"],
    best_for: "IT workers with budget constraint",
    buy_window: "6mo",
    buy_window_reason: "Metro Green Line extension DPR approved. Pre-metro pricing window closing.",
    min_budget_sqft: 7000, typical_size_sqft: 1000, stamp_duty_pct: 5.6,
    price_24m_change_pct: 19.2, price_momentum: "stable",
    risk_flood: 1, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Some low-lying areas near streams. Verify BDA drainage compliance.",
    risk_legal_note: "RERA density moderate. Verify project registration before booking.",
    risk_infra_note: "Metro extension DPR stage — 3-4yr execution risk.",
    metro_km: 3.8, metro_note: "Silk Board Purple Line 4km; Green Line ext planned 2028",
    hospital_km: 2.1, hospital_note: "BGS / Sparsh within 2km",
    school_km: 1.8, school_note: "Good school options within 2km",
    it_park_km: 1.2, it_park_note: "Electronic City Phase 1&2 within 1.5km",
    analyst_take: "Good affordability play for EC workers. Price advantage over Sarjapur/HSR is real. Buy flat now if workplace is EC or Bannerghatta. Metro will re-rate this.",
  },
  west_mid: {
    property_types: ["2BHK Flat", "Plot", "Row House"],
    best_for: "Self-use + moderate appreciation; west commute users",
    buy_window: "6mo",
    buy_window_reason: "Mysore Road metro operational. NICE Road access improving. 6mo window left.",
    min_budget_sqft: 5800, typical_size_sqft: 1100, stamp_duty_pct: 5.6,
    price_24m_change_pct: 22.4, price_momentum: "stable",
    risk_flood: 0, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Generally low flood risk. Higher elevation than east Bangalore.",
    risk_legal_note: "Mixed — some peri-urban pockets have conversion issues. Insist on BDA/BMRDA approvals.",
    risk_infra_note: "Metro operational. NICE Road Phase 3 under tender. Low risk.",
    metro_km: 1.4, metro_note: "Purple Line Kengeri / Mysore Road station < 1.5km",
    hospital_km: 3.1, hospital_note: "BGS Gleneagles 3km",
    school_km: 1.9, school_note: "Schools available; fewer international options",
    it_park_km: 6.4, it_park_note: "Manyata via ORR ~7km; better suited for west-side employers",
    analyst_take: "Value zone. Underpriced relative to east Bangalore. Suits buyers working in Mysore Road/Peenya corridor. Plots here have 30%+ 3yr upside.",
  },
  airport_north: {
    property_types: ["Plot", "Villa", "2BHK Flat"],
    best_for: "Plot investors — pre-airport appreciation play",
    buy_window: "now",
    buy_window_reason: "Airport Terminal 2 live. PRR North alignment confirmed. 12–18 month buy window before institutions price it up.",
    min_budget_sqft: 5000, typical_size_sqft: 1200, stamp_duty_pct: 5.6,
    price_24m_change_pct: 31.4, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "Low flood risk. North Bangalore drains away from city. No lake adjacency.",
    risk_legal_note: "Mix of RERA and direct land sales. For plots: verify DC conversion, BDA-approved layout. Avoid unapproved agricultural land.",
    risk_infra_note: "PRR + Metro Phase 3 confirmed but 3-4yr away. Buy for long horizon.",
    metro_km: 6.2, metro_note: "Phase 3 Yelahanka–Devanahalli planned 2028; Yelahanka station 6km",
    hospital_km: 4.8, hospital_note: "Columbia Asia Hebbal 5km; local clinics only in zone",
    school_km: 3.4, school_note: "Schools in Yelahanka / Devanahalli towns",
    it_park_km: 4.1, it_park_note: "KIAL Aerocity employment zone 4–6km; Manyata 12km",
    analyst_take: "Best risk/reward in this category is PLOTS. Airport Aerocity effect is proven (Devanahalli 5x since 2010). Buy 30x40 or 40x60 plots in BDA-approved layouts. 3yr flip potential is 40–60%.",
  },
  east_emrg: {
    property_types: ["Plot", "Independent House", "Early-stage Flat"],
    best_for: "Investors with 3–5yr horizon; ORR/PRR play",
    buy_window: "now",
    buy_window_reason: "ORR extension tender finalised. IT spill-over from Whitefield beginning. 18-month window.",
    min_budget_sqft: 3800, typical_size_sqft: 1000, stamp_duty_pct: 5.6,
    price_24m_change_pct: 28.6, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "Low risk. Higher terrain than central east.",
    risk_legal_note: "Peri-urban pockets. Verify DC conversion & layout approval before buying. Avoid agriculture-zone land.",
    risk_infra_note: "ORR extension funded, tender finalised. Moderate risk — 2026 completion.",
    metro_km: 8.4, metro_note: "Closest metro: Whitefield Purple Line 8–10km",
    hospital_km: 5.8, hospital_note: "Manipal Hospital Whitefield 6km",
    school_km: 4.2, school_note: "Schools sparse — gap is a risk for families",
    it_park_km: 4.8, it_park_note: "Prestige Tech Park / ITPB via ORR 5km",
    analyst_take: "Pure investor play, not for self-use yet. Buy plots in BDA-approved layouts at ₹3,800–4,500/sqft. ORR extension + IT spill-over = 40–55% 3yr appreciation. Not for families moving in immediately.",
  },
  south_emrg: {
    property_types: ["Plot", "Independent House"],
    best_for: "Industrial corridor play; long-horizon plot investors",
    buy_window: "12mo",
    buy_window_reason: "KIADB Phase 3 allocation beginning. NICE Road Phase 3 under tender. 12-month lead window.",
    min_budget_sqft: 3200, typical_size_sqft: 900, stamp_duty_pct: 5.6,
    price_24m_change_pct: 24.1, price_momentum: "stable",
    risk_flood: 1, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "Some low-lying terrain near Hulimangala. Check elevation before buying.",
    risk_legal_note: "Agricultural land conversion ongoing. Insist on DC conversion order & RERA/BDA approval.",
    risk_infra_note: "KIADB and NICE Road dependent. Timeline risk is moderate.",
    metro_km: 10.2, metro_note: "No metro planned within 5yr for this zone",
    hospital_km: 6.4, hospital_note: "Narayana Hrudayalaya Electronic City 6km",
    school_km: 5.1, school_note: "Very limited schooling — major gap for families",
    it_park_km: 5.8, it_park_note: "Electronic City Phase 2 / Jigani KIADB 6km",
    analyst_take: "Industrial corridor play. Best for pure land banking with 5yr+ horizon. Not self-use ready. Buy DC-converted BDA plots at ₹3,000–3,800/sqft. Exit when NICE Road Phase 3 delivers.",
  },
  frontier_north: {
    property_types: ["Plot (30x40, 40x60, 60x40)"],
    best_for: "Maximum ROI land banking — airport / SEZ anchor",
    buy_window: "now",
    buy_window_reason: "KIAL T2 live. Aerocity SEZ notified. Institutional money arriving in 6–12 months. This is the last window at current prices.",
    min_budget_sqft: 2200, typical_size_sqft: 600, stamp_duty_pct: 5.6,
    price_24m_change_pct: 38.2, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "Low flood risk. North Bangalore / peripheral terrain drains well.",
    risk_legal_note: "Mixed — BDA-approved layouts exist but many unapproved pockets. ONLY buy BDA/KIADB-approved layouts. Demand 'A-Khata' and DC conversion documents.",
    risk_infra_note: "HIGH: thesis is 100% airport + infra dependent. If PRR or SEZ delays, timeline extends 3–5yr. Size position accordingly.",
    metro_km: 10.4, metro_note: "Metro Phase 3 planned but 4–5yr away. Don't price it in.",
    hospital_km: 7.8, hospital_note: "Nearest major hospital 8–10km. Not self-use ready.",
    school_km: 6.8, school_note: "Very limited. Not a family zone yet.",
    it_park_km: 5.2, it_park_note: "KIAL Aerocity / Aerospace SEZ 5–8km",
    analyst_take: "HIGHEST return, HIGHEST patience required. Buy 30x40 BDA-approved plots at ₹2,000–2,500/sqft now. Do NOT buy unapproved agricultural land regardless of price. Target: 2x in 5 years. This is investment money, not home purchase money.",
  },
  frontier_west: {
    property_types: ["Plot (40x60, 60x80)"],
    best_for: "Industrial NIMZ / Smart City land banking",
    buy_window: "now",
    buy_window_reason: "Dabaspet NIMZ Phase 1 operational. Bidadi Smart City gazetted. First-mover window open.",
    min_budget_sqft: 1800, typical_size_sqft: 600, stamp_duty_pct: 5.6,
    price_24m_change_pct: 42.8, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "Low risk. Tumkur Road / Mysore Road corridors at good elevation.",
    risk_legal_note: "Industrial conversion risk. Buy only in KIADB-notified zones or BMRDA-approved layouts. Avoid private unapproved layouts.",
    risk_infra_note: "HIGH: full thesis depends on NIMZ/Smart City execution. Both are GoI/GoK backed which reduces (not eliminates) risk. Size conservatively.",
    metro_km: 14.2, metro_note: "No metro — Tumkur/Mysore Road corridors are bus/road-dependent",
    hospital_km: 9.1, hospital_note: "City hospitals 30–45min drive. Pure investment zone.",
    school_km: 8.4, school_note: "No quality schools yet. Not for immediate residential use.",
    it_park_km: 12.8, it_park_note: "Industrial employment (Toyota, manufacturing) closer than IT parks",
    analyst_take: "Pure land banking play for investors with 5–7yr horizon and risk tolerance. Minimum ticket ₹15–25L for a 1,200 sqft plot. NIMZ and Smart City are government-backed anchors — that's the difference from speculative plays. Don't bet more than 15–20% of portfolio here.",
  },
};

// Zone-specific overrides for the most important individual zones
const ZONE_BRIEF: Record<string, BuyerBrief> = {
  "8a3d3a2c9ffffff": { // Whitefield
    property_types: ["2BHK / 3BHK Flat", "Villa Township"],
    best_for: "IT professionals — live 400m from office",
    buy_window: "now",
    buy_window_reason: "Purple Line metro opened. Pre-metro price discovery already happened. Buy before next IT park expansion (ITPB Phase 4 under construction).",
    min_budget_sqft: 9000, typical_size_sqft: 1300, stamp_duty_pct: 5.6,
    price_24m_change_pct: 29.6, price_momentum: "accelerating",
    risk_flood: 1, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Varthur and Bellandur lakes are flood risk vectors. Ask builder for BDA drainage clearance certificate before booking.",
    risk_legal_note: "RERA compliance very high in Whitefield. Large township projects (Prestige, Sobha, Brigade) all clear.",
    risk_infra_note: "Metro operational. ORR signal-free corridor live. Infrastructure fully in place.",
    metro_km: 0.8, metro_note: "Whitefield Purple Line station now open",
    hospital_km: 3.2, hospital_note: "Sakra World Hospital 3km; Manipal Whitefield 4km",
    school_km: 1.1, school_note: "Inventure Academy 1km; Greenwood High 1.5km",
    it_park_km: 0.4, it_park_note: "ITPB / Prestige Tech Park walkable — 400m",
    analyst_take: "Best flat purchase in east Bangalore. Metro + top IT park walkability is rare. Buy 3BHK 1,400 sqft at ₹9,500–10,500/sqft. Total cost ~₹1.4–1.5Cr. Rental yield 2.8–3.2% while holding. 3yr appreciation: 28–35%.",
  },
  "8a3d3a3a1ffffff": { // Devanahalli Aerospace
    property_types: ["Plot (30x40, 40x60)", "Villa in Gated Township"],
    best_for: "Airport-city appreciation — highest ROI in Bangalore",
    buy_window: "now",
    buy_window_reason: "KIAL T2 live (55M capacity). Aerospace Park Phase 2 SEZ notified. Aerocity residential demand beginning. This zone has 3–6 month window before developer launches price revision.",
    min_budget_sqft: 8000, typical_size_sqft: 1000, stamp_duty_pct: 5.6,
    price_24m_change_pct: 44.2, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "No flood risk. High elevation, north Bangalore, drains away from city.",
    risk_legal_note: "ONLY buy BDA-approved or BIAAPA-approved layouts. Demand Khata and DC conversion. Aerocity zone land has some complex titles — use a reputed builder or a RERA-registered project.",
    risk_infra_note: "Airport is live, but direct road links (STRR spur, Metro) are 3–4yr away. All road access currently via Bellary Road or NH44.",
    metro_km: 12.1, metro_note: "Metro Phase 3 Devanahalli planned ~2028–2029",
    hospital_km: 8.4, hospital_note: "Columbia Asia Hebbal 28km; local health centre only",
    school_km: 5.2, school_note: "Schools in Devanahalli town 5km",
    it_park_km: 4.1, it_park_note: "Aerospace Park SEZ 4km; Manyata Tech 28km",
    analyst_take: "Highest conviction buy in Bangalore. Devanahalli prices went 5x in 10 years post-airport announcement (2005→2015). Phase 2 (Aerospace SEZ + Aerocity) is the next catalyst. Buy plots in BIAAPA-approved layouts. Minimum ₹40L for 500 sqft (₹8,000/sqft). 3yr target: ₹13,000–15,000/sqft. Do your legal homework — title is the only risk here.",
  },
  "8a3d3a3b1ffffff": { // Bagalur
    property_types: ["Plot (30x40, 40x60, 60x40)"],
    best_for: "Highest potential ROI — 8km from airport, pre-discovery",
    buy_window: "now",
    buy_window_reason: "KIAL 8km direct. Link road approved and construction started. Institutional money (Sobha, Prestige land banking) beginning. This is the last cheap window — 6–9 months.",
    min_budget_sqft: 4000, typical_size_sqft: 1200, stamp_duty_pct: 5.6,
    price_24m_change_pct: 38.6, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "No flood risk. Bagalur is at high elevation — aerial imagery confirms no lake adjacency.",
    risk_legal_note: "CRITICAL: agricultural land is cheap but HIGH legal risk. Only buy DC-converted BDA-approved layouts. Reputed developers: Shriram, JK Group, Assetz. Reject anything without Khata.",
    risk_infra_note: "HIGH: link road is approved but 2yr away. Metro is 4–5yr plan. Thesis is airport economy — if KIAL traffic slows, prices slow. Size position at 15–20% of portfolio max.",
    metro_km: 13.2, metro_note: "No metro in zone; KIAL Terminal as employer anchor instead",
    hospital_km: 8.8, hospital_note: "Columbia Asia 30km. Not self-use ready.",
    school_km: 6.4, school_note: "No schools — pure investment zone",
    it_park_km: 4.8, it_park_note: "Bagalur–KIAL Aerocity zone 5km; aerospace SEZ 6km",
    analyst_take: "The highest potential play right now. ₹4,000–4,500/sqft today for a 30x40 plot = ₹19–22L total investment. 3yr price target: ₹7,000–8,000/sqft. But: ONLY BDA-approved layouts. Legal homework is non-negotiable here. Don't take shortcuts — title is everything.",
  },
  "8a3d3a041ffffff": { // Dabaspet NIMZ
    property_types: ["Industrial Plot", "Residential Plot (near NIMZ periphery)"],
    best_for: "Industrial corridor land banking — 5–7yr horizon",
    buy_window: "now",
    buy_window_reason: "NIMZ Phase 1 operational — first 38 manufacturing units allotted. Phase 2 land bank cleared. Residential plot prices around NIMZ haven't caught up yet.",
    min_budget_sqft: 1700, typical_size_sqft: 1200, stamp_duty_pct: 5.6,
    price_24m_change_pct: 48.2, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "No flood risk. Tumkur Road corridor is high elevation.",
    risk_legal_note: "ONLY KIADB-notified plots or BMRDA-approved layouts for residential. Avoid private unapproved layouts near the NIMZ perimeter.",
    risk_infra_note: "HIGH: full upside is NIMZ execution dependent. Phase 1 delivered — reduces risk. Phase 2 is GoI-backed which is a positive signal. Still a 5–7yr play.",
    metro_km: 18.4, metro_note: "No metro planned for this corridor within 5yr",
    hospital_km: 9.2, hospital_note: "City hospitals in Nelamangala 9km; Bangalore city 40km",
    school_km: 8.1, school_note: "Not a family zone yet",
    it_park_km: 14.2, it_park_note: "Manufacturing/industrial employment vs IT — different demand profile",
    analyst_take: "Pure land banking. ₹1,700–2,000/sqft at NIMZ periphery = ₹12–15L for a 60x40 plot. NIMZ analogy: Peenya (1970s) → industrial demand → residential demand lag of 10–15yr. This is a 5–7yr play not 3yr. Conservative sizing recommended: ₹10–20L investment bracket.",
  },
  "8a3d3a051ffffff": { // Bidadi Smart City
    property_types: ["Plot (30x40, 40x60)", "Plotted Development"],
    best_for: "Smart city ground-floor entry — Mysore Road corridor",
    buy_window: "now",
    buy_window_reason: "Smart City master plan gazetted June 2025. Toyota expansion confirmed (2,500 new jobs). Godrej already acquired 120 acres. Developer money arriving. 6-month first-mover window.",
    min_budget_sqft: 2100, typical_size_sqft: 1200, stamp_duty_pct: 5.6,
    price_24m_change_pct: 52.4, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "Low risk. Mysore Road corridor is well above flood plains.",
    risk_legal_note: "Smart City zone plots: only BMRDA-approved. Godrej, Prestige project pre-launches arriving — prefer reputed developers in first phase.",
    risk_infra_note: "HIGH: Smart City master plan just gazetted. Metro spur is a proposal (DPR Dec 2025). Toyota is the real anchor — manufacturing employment, not IT.",
    metro_km: 16.8, metro_note: "Metro spur proposed; DPR Dec 2025; 5–6yr to station",
    hospital_km: 8.4, hospital_note: "Mysore Road has limited healthcare; city hospitals 35km",
    school_km: 7.2, school_note: "Schools planned in master plan but not built yet",
    it_park_km: 16.2, it_park_note: "Not an IT corridor — Toyota/manufacturing employment",
    analyst_take: "Bidadi is a 3x play in 5yr if Smart City executes. Buy ₹2,000–2,300/sqft in BMRDA-approved layouts now. Total outlay: ₹15–20L for a 600 sqft plot. Comparable: Whitefield 2004 when IT parks just announced. Exit when developers launch phase 1 projects at 2.5x land price. High conviction, high patience.",
  },
};
