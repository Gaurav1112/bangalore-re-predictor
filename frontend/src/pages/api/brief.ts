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

// ─── Shared constants ──────────────────────────────────────────────────────────

const REG_PCT = 1.0;
const TAX_NOTE =
  "LTCG (hold >2yr): 20% with indexation. STCG (<2yr): income slab rate. " +
  "TDS: deduct 1% (Sec 194-IA) if total >₹50L — deposit before registration. " +
  "54EC bonds defer LTCG if invested within 6 months of sale.";

const DOCS_APARTMENT = [
  "RERA registration number — verify at rera.karnataka.gov.in before booking",
  "OC (Occupancy Certificate) from BDA/BBMP — mandatory for ready-to-move",
  "CC (Completion Certificate) from local municipal authority",
  "Encumbrance Certificate (EC) — 30-year search from Sub-Registrar office",
  "Khata A Certificate + Khata Extract from BBMP",
  "BDA/BBMP-approved building plan — match plan with actual structure",
  "Property tax receipts — last 3 years + no-dues certificate",
];
const DOCS_RESIDENTIAL_PLOT = [
  "DC conversion order — agricultural to non-agricultural land (CRITICAL)",
  "BDA / BMRDA / KIADB layout approval certificate — verify with issuing authority",
  "A-Khata certificate only (reject B-Khata — major legal risk for resale)",
  "Encumbrance Certificate (EC) — 30-year search from Sub-Registrar",
  "Survey tippani / sketch from Sub-Registrar office — verify plot boundaries",
  "RTC (Record of Rights, Tenancy & Crops) from Village Accountant",
  "RERA certificate if buying in a registered plotted development",
];
const DOCS_FRONTIER_PLOT = [
  "BDA / KIADB / BIAAPA layout approval — MANDATORY. Reject all unapproved layouts.",
  "DC conversion order — demand original document, not photocopy. Verify at Sub-Registrar.",
  "A-Khata certificate (not B-Khata, not P-Khata — A-Khata only for clear title)",
  "Encumbrance Certificate — 30-year search from Sub-Registrar office",
  "RTC (Record of Rights, Tenancy & Crops) from Village Accountant",
  "Survey tippani from Sub-Registrar — physically verify plot boundaries on site",
  "NOC from BIAAPA or Airport Authority of India if plot is within 10km of KIAL",
];

// ─── Price history (2020–2025) ────────────────────────────────────────────────
const PH: Record<string, { year: number; price_sqft: number }[]> = {
  premium:       [{ year:2020, price_sqft:10800 },{ year:2021, price_sqft:11200 },{ year:2022, price_sqft:12100 },{ year:2023, price_sqft:13200 },{ year:2024, price_sqft:14400 },{ year:2025, price_sqft:15200 }],
  premium_trad:  [{ year:2020, price_sqft:8400  },{ year:2021, price_sqft:8800  },{ year:2022, price_sqft:9600  },{ year:2023, price_sqft:10800 },{ year:2024, price_sqft:11800 },{ year:2025, price_sqft:12400 }],
  tech_est:      [{ year:2020, price_sqft:6200  },{ year:2021, price_sqft:6500  },{ year:2022, price_sqft:7200  },{ year:2023, price_sqft:8400  },{ year:2024, price_sqft:9600  },{ year:2025, price_sqft:10200 }],
  south_it:      [{ year:2020, price_sqft:5600  },{ year:2021, price_sqft:5900  },{ year:2022, price_sqft:6400  },{ year:2023, price_sqft:7100  },{ year:2024, price_sqft:7800  },{ year:2025, price_sqft:8000  }],
  west_mid:      [{ year:2020, price_sqft:4100  },{ year:2021, price_sqft:4400  },{ year:2022, price_sqft:4900  },{ year:2023, price_sqft:5500  },{ year:2024, price_sqft:6100  },{ year:2025, price_sqft:6400  }],
  airport_north: [{ year:2020, price_sqft:5100  },{ year:2021, price_sqft:5500  },{ year:2022, price_sqft:6200  },{ year:2023, price_sqft:7400  },{ year:2024, price_sqft:8600  },{ year:2025, price_sqft:9200  }],
  east_emrg:     [{ year:2020, price_sqft:2100  },{ year:2021, price_sqft:2400  },{ year:2022, price_sqft:2900  },{ year:2023, price_sqft:3500  },{ year:2024, price_sqft:4100  },{ year:2025, price_sqft:4600  }],
  south_emrg:    [{ year:2020, price_sqft:1800  },{ year:2021, price_sqft:2000  },{ year:2022, price_sqft:2400  },{ year:2023, price_sqft:2900  },{ year:2024, price_sqft:3400  },{ year:2025, price_sqft:3600  }],
  frontier_north:[{ year:2020, price_sqft:1400  },{ year:2021, price_sqft:1700  },{ year:2022, price_sqft:2200  },{ year:2023, price_sqft:2900  },{ year:2024, price_sqft:3700  },{ year:2025, price_sqft:4200  }],
  frontier_west: [{ year:2020, price_sqft:800   },{ year:2021, price_sqft:1000  },{ year:2022, price_sqft:1300  },{ year:2023, price_sqft:1800  },{ year:2024, price_sqft:2200  },{ year:2025, price_sqft:2500  }],
};

// ─── Neighborhood quality (1–5 stars) ────────────────────────────────────────
const NB: Record<string, { label: string; stars: number; note: string }[]> = {
  premium: [
    { label: "Connectivity",  stars: 5, note: "Metro + ORR + inner ring road, cabs abundant" },
    { label: "Schools",       stars: 5, note: "DPS, NPS, Inventure, Vidyashilp — all within 1km" },
    { label: "Healthcare",    stars: 5, note: "Fortis, Manipal, Narayana — all within 2km" },
    { label: "Safety",        stars: 4, note: "Well-lit, BBMP maintained. Busy nightlife areas." },
    { label: "Livability",    stars: 4, note: "High-density, great restaurants & malls. Some noise." },
  ],
  premium_trad: [
    { label: "Connectivity",  stars: 4, note: "Metro accessible, excellent auto/bus network" },
    { label: "Schools",       stars: 5, note: "NPS, DPS, Ryan International cluster all nearby" },
    { label: "Healthcare",    stars: 5, note: "Jayadeva, Columbia Asia, Narayana within 3km" },
    { label: "Safety",        stars: 5, note: "Family-friendly, good police presence, well-lit" },
    { label: "Livability",    stars: 5, note: "Tree-lined, park-rich, quiet residential — best in class" },
  ],
  tech_est: [
    { label: "Connectivity",  stars: 4, note: "Metro now open, IT parks walkable, ORR access" },
    { label: "Schools",       stars: 4, note: "International schools (Greenwood, Inventure) 1–2km" },
    { label: "Healthcare",    stars: 3, note: "Hospitals 2–4km, not walking distance" },
    { label: "Safety",        stars: 4, note: "Gated communities, IT zone security" },
    { label: "Livability",    stars: 3, note: "Heavy peak-hour traffic. Improving with metro." },
  ],
  south_it: [
    { label: "Connectivity",  stars: 3, note: "Metro 4km. Good bus network but crowded." },
    { label: "Schools",       stars: 3, note: "Adequate schooling within 2km" },
    { label: "Healthcare",    stars: 3, note: "BGS Gleneagles, Sparsh within 2km" },
    { label: "Safety",        stars: 4, note: "Mixed residential+IT zone. Generally safe." },
    { label: "Livability",    stars: 3, note: "Improving with EC expansion. Some traffic issues." },
  ],
  west_mid: [
    { label: "Connectivity",  stars: 4, note: "Metro Purple Line Kengeri/Mysore Road now open" },
    { label: "Schools",       stars: 3, note: "Schools available; fewer international options" },
    { label: "Healthcare",    stars: 3, note: "BGS Gleneagles 3km; larger hospitals 8km" },
    { label: "Safety",        stars: 4, note: "Quieter, lower density — low crime area" },
    { label: "Livability",    stars: 4, note: "Greener, less congested. Underrated zone." },
  ],
  airport_north: [
    { label: "Connectivity",  stars: 3, note: "BMTC airport buses. Metro arriving 2027–28." },
    { label: "Schools",       stars: 3, note: "Schools in Yelahanka/Devanahalli town 3–5km" },
    { label: "Healthcare",    stars: 2, note: "Nearest major hospital 5–8km. Risk for families." },
    { label: "Safety",        stars: 4, note: "Low crime. Open land. No urban density yet." },
    { label: "Livability",    stars: 2, note: "Not for living yet. Investment zone only." },
  ],
  east_emrg: [
    { label: "Connectivity",  stars: 2, note: "Metro 8–10km. ORR extension in progress (2026)." },
    { label: "Schools",       stars: 2, note: "Sparse schooling. Major gap for families." },
    { label: "Healthcare",    stars: 2, note: "Nearest hospital 5–6km. Not self-use ready." },
    { label: "Safety",        stars: 3, note: "Semi-rural. Low crime but limited policing." },
    { label: "Livability",    stars: 1, note: "NOT for living yet. Bare land + early development." },
  ],
  south_emrg: [
    { label: "Connectivity",  stars: 2, note: "Road only. No metro within 10km." },
    { label: "Schools",       stars: 1, note: "Very limited. Major gap. Not for families." },
    { label: "Healthcare",    stars: 2, note: "Narayana Hrudayalaya EC 6km" },
    { label: "Safety",        stars: 3, note: "Industrial corridor. Low residential crime." },
    { label: "Livability",    stars: 1, note: "Industrial zone. Not livable yet." },
  ],
  frontier_north: [
    { label: "Connectivity",  stars: 2, note: "Airport bus only. Metro is 4–5yr away." },
    { label: "Schools",       stars: 1, note: "No quality schools in zone yet." },
    { label: "Healthcare",    stars: 1, note: "8–10km to nearest major hospital. Emergency risk." },
    { label: "Safety",        stars: 3, note: "Low crime. Peripheral open terrain." },
    { label: "Livability",    stars: 1, note: "NOT for living. Pure investment. 5yr horizon." },
  ],
  frontier_west: [
    { label: "Connectivity",  stars: 1, note: "Road-only. No metro within 15km." },
    { label: "Schools",       stars: 1, note: "No schools in zone. City schools 35km away." },
    { label: "Healthcare",    stars: 1, note: "Nearest hospital 9km. Not for families." },
    { label: "Safety",        stars: 3, note: "Industrial peripheral zone. Low crime." },
    { label: "Livability",    stars: 1, note: "Not livable. 7yr+ horizon for any amenities." },
  ],
};

// ─── Infrastructure pipeline ──────────────────────────────────────────────────
const INFRA: Record<string, { name: string; year: number; impact: "high" | "medium" | "low"; done?: boolean }[]> = {
  premium: [
    { name: "Metro Phase 2B Silk Board–KR Puram", year: 2025, impact: "high" },
    { name: "ORR signal-free elevated Phase 3",    year: 2026, impact: "medium" },
    { name: "BBMP Central Business District TOD",  year: 2026, impact: "medium" },
  ],
  premium_trad: [
    { name: "Metro Green Line JP Nagar–Gottigere", year: 2025, impact: "high" },
    { name: "Kanakapura Road 8-lane widening",     year: 2026, impact: "medium" },
    { name: "BBMP stormwater drain upgrade",       year: 2027, impact: "low" },
  ],
  tech_est: [
    { name: "Metro Purple Line fully operational", year: 2025, impact: "high", done: true },
    { name: "ITPB Phase 4 expansion (18,000 seats)", year: 2026, impact: "high" },
    { name: "ORR–Sarjapur signal-free elevated",   year: 2027, impact: "high" },
    { name: "PRR East: Sarjapur connector",        year: 2028, impact: "high" },
  ],
  south_it: [
    { name: "Hosur Road 8-lane widening",          year: 2026, impact: "medium" },
    { name: "Metro Green Line extension DPR",      year: 2028, impact: "high" },
    { name: "ITIR Bangalore–Mysore land acquisition", year: 2027, impact: "medium" },
  ],
  west_mid: [
    { name: "Mysore Road Metro operational",       year: 2024, impact: "high", done: true },
    { name: "Bidadi Smart City master plan",       year: 2025, impact: "medium" },
    { name: "NICE Road Phase 3 Attibele extension",year: 2027, impact: "high" },
  ],
  airport_north: [
    { name: "KIAL Terminal 2 opened (55M cap)",    year: 2024, impact: "high", done: true },
    { name: "Aerocity residential zone Phase 1",   year: 2026, impact: "high" },
    { name: "PRR North: Hebbal–Yelahanka",         year: 2027, impact: "high" },
    { name: "Metro Phase 3: Yelahanka–Devanahalli",year: 2028, impact: "high" },
  ],
  east_emrg: [
    { name: "ORR–Hoskote extension (tender done)", year: 2026, impact: "high" },
    { name: "PRR East: Sarjapur–Hoskote section",  year: 2027, impact: "high" },
    { name: "ITPB spill-over tech parks",          year: 2026, impact: "medium" },
  ],
  south_emrg: [
    { name: "KIADB Phase 3 industrial allotment",  year: 2025, impact: "medium" },
    { name: "NICE Road Phase 3 Attibele section",  year: 2027, impact: "high" },
    { name: "Jigani KIADB Phase 4",                year: 2028, impact: "medium" },
  ],
  frontier_north: [
    { name: "Aerospace Park Phase 2 SEZ notified", year: 2025, impact: "high", done: true },
    { name: "Bagalur–KIAL 4-lane link road",       year: 2026, impact: "high" },
    { name: "STRR: North Bangalore highway spur",  year: 2027, impact: "high" },
    { name: "Metro Phase 3: to Devanahalli",       year: 2028, impact: "high" },
    { name: "KIAL T3 construction begins",         year: 2029, impact: "medium" },
  ],
  frontier_west: [
    { name: "Dabaspet NIMZ Phase 1 operational",   year: 2024, impact: "high", done: true },
    { name: "Bidadi Smart City master plan",       year: 2025, impact: "high", done: true },
    { name: "NH4 6-lane widening complete",        year: 2025, impact: "medium", done: true },
    { name: "Toyota Kirloskar expansion: 2,500 jobs", year: 2026, impact: "high" },
    { name: "NIMZ Phase 2 GoI clearance",          year: 2026, impact: "high" },
    { name: "Metro spur to Bidadi (DPR)",          year: 2030, impact: "medium" },
  ],
};

// ─── Active developers ────────────────────────────────────────────────────────
const DEV: Record<string, string[]> = {
  premium:       ["Prestige Group", "Brigade Group", "Sobha Realty", "Godrej Properties", "Embassy Group"],
  premium_trad:  ["Total Environment", "Puravankara", "Brigade Group", "Prestige Group"],
  tech_est:      ["Prestige Group", "Salarpuria Sattva", "Sobha Realty", "Godrej Properties"],
  south_it:      ["Century Realty", "Assetz Property", "Mahindra Lifespaces", "Provident Housing"],
  west_mid:      ["Provident Housing", "Nambiar Builders", "SMR Group", "SJR Group"],
  airport_north: ["Shriram Properties", "Ozone Group", "SNN Estates", "Assetz Property"],
  east_emrg:     ["Shriram Properties", "Novel Office Spaces", "Sumadhura Group"],
  south_emrg:    ["Prestige Smart City (adjacent)", "NS Developers", "VGN Group"],
  frontier_north:["Shriram Properties", "JK Group", "Assetz Property"],
  frontier_west: ["Godrej Properties", "Prestige Group", "TVS Housing", "Shriram"],
};

// ─── Simple verdicts (plain English for any user) ─────────────────────────────
const VERDICT: Record<string, string> = {
  premium:       "Great area for living, not for big returns. If your office is nearby, buy here. For growth on your money, look at Sarjapur or Whitefield instead.",
  premium_trad:  "Best zone for families. Excellent schools, parks, hospitals, and metro all close by. Your money grows steadily at 8–10% per year. Perfect for long-term living.",
  tech_est:      "Best zone for IT professionals. Metro arrived + top IT parks nearby = your home value will grow fast. Act now before the next price revision.",
  south_it:      "Budget-friendly IT zone. 30–40% cheaper than Whitefield for the same kind of lifestyle. Good choice if you work in Electronic City.",
  west_mid:      "Undervalued zone. Metro is now running here. Plots still available at fair prices. A hidden gem in Bangalore real estate.",
  airport_north: "Airport boom zone. The airport doubled its size in 2024 — this is changing everything nearby, just like it did in Devanahalli 10 years ago. Buy plots now.",
  east_emrg:     "Good for investors, NOT for families yet. Buy plots. In 3–5 years this area will be developed with better roads and amenities. Do not move here immediately.",
  south_emrg:    "Long-term industrial land play. Government is building factories here. Buy only if you can wait 5–7 years. Not for people who need to live or rent soon.",
  frontier_north:"Highest reward, highest patience needed. Like Devanahalli in 2008 or Whitefield in 2002 — early stage, big potential. Only for experienced investors who understand risk.",
  frontier_west: "Government-backed factories (NIMZ) and Smart City projects are here. Very early stage. High potential but you must wait 5–7 years. Put only 10–15% of your savings here.",
};

// ─── Net 3yr return (after stamp duty 6.5%, brokerage 2%, LTCG ~20% on gain, maintenance) ──
const NET3YR: Record<string, number> = {
  premium:       2.5,   // 19.4% gross – 6.5% entry – 2% exit – 3.9% LTCG – 4.5% maint = 2.5%
  premium_trad:  3.1,   // 20.1% gross – same deductions
  tech_est:      10.2,  // 29% gross
  south_it:      1.6,   // 18.3% gross
  west_mid:      13.8,  // 27.9% gross, plots (no maintenance)
  airport_north: 17.2,  // 32.1% gross, plots
  east_emrg:     21.4,  // 37.4% gross, plots
  south_emrg:    18.2,  // 33.4% gross, plots
  frontier_north:38.2,  // 58.4% gross, plots
  frontier_west: 42.2,  // 63.4% gross, plots
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface PriceHistoryEntry   { year: number; price_sqft: number; }
interface InfraPipelineItem   { name: string; year: number; impact: "high"|"medium"|"low"; done?: boolean; }
interface NeighborhoodStarItem{ label: string; stars: number; note: string; }
interface BuyerBriefAltZone   { zone_h3: string; zone_name: string; price_sqft: number; why: string; }
interface BuyerBriefSize      { label: string; sqft: number; }

interface BuyerBrief {
  property_types: string[];
  best_for: string;
  buy_window: "now" | "6mo" | "12mo" | "wait";
  buy_window_reason: string;
  min_budget_sqft: number;
  typical_size_sqft: number;
  stamp_duty_pct: number;
  registration_pct: number;
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
  docs_checklist: string[];
  alt_zones: BuyerBriefAltZone[];
  tax_note: string;
  sizes: BuyerBriefSize[];
  price_history: PriceHistoryEntry[];
  rental_yield_pct: number;
  developers: string[];
  infra_pipeline: InfraPipelineItem[];
  neighborhood_stars: NeighborhoodStarItem[];
  simple_verdict: string;
  net_3yr_return_pct: number;
}

// ─── Category briefs ─────────────────────────────────────────────────────────
const CATEGORY_BRIEF: Record<string, BuyerBrief> = {
  premium: {
    property_types: ["2BHK / 3BHK Flat", "Luxury Apartment"],
    best_for: "Capital preservation + moderate appreciation",
    buy_window: "wait",
    buy_window_reason: "Price already fully discovered. Better value 5–8km out on same corridors.",
    min_budget_sqft: 14000, typical_size_sqft: 1300, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
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
    docs_checklist: DOCS_APARTMENT,
    alt_zones: [
      { zone_h3: "8a3d3a127ffffff", zone_name: "HSR Layout",    price_sqft: 11400, why: "30% cheaper, same IT belt, superior ROI potential" },
      { zone_h3: "8a3d3a2d9ffffff", zone_name: "Sarjapur Road", price_sqft: 9800,  why: "40% cheaper, top tech corridor, metro incoming" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "2BHK", sqft: 1100 }, { label: "3BHK", sqft: 1500 }, { label: "4BHK+", sqft: 2200 }],
    price_history: PH.premium,
    rental_yield_pct: 2.4,
    developers: DEV.premium,
    infra_pipeline: INFRA.premium,
    neighborhood_stars: NB.premium,
    simple_verdict: VERDICT.premium,
    net_3yr_return_pct: NET3YR.premium,
  },

  premium_trad: {
    property_types: ["2BHK / 3BHK Flat", "Independent House", "Row House"],
    best_for: "Family living with stable appreciation",
    buy_window: "6mo",
    buy_window_reason: "Metro Phase 2 pricing starting to get in. Still a 6-month window before institutions arrive.",
    min_budget_sqft: 12000, typical_size_sqft: 1400, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
    price_24m_change_pct: 21.2, price_momentum: "stable",
    risk_flood: 0, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Low risk. Stick to layouts above 900m elevation for extra safety.",
    risk_legal_note: "RERA compliance very high. Established layouts, minimal encumbrance risk.",
    risk_infra_note: "Fully developed. No execution dependency.",
    metro_km: 1.2, metro_note: "Green/Purple Line station under 1.5km",
    hospital_km: 1.8, hospital_note: "Jayadeva / Columbia Asia within 2km",
    school_km: 0.5, school_note: "Strong school cluster — NPS, DPS, Vidyashilp within 600m",
    it_park_km: 3.8, it_park_note: "Manyata / Embassy via ORR ~4km",
    analyst_take: "Best in class for families. Schools, green cover, metro access. Appreciation is stable not explosive — ideal for own use with 10yr horizon.",
    docs_checklist: DOCS_APARTMENT,
    alt_zones: [
      { zone_h3: "8a3d3a14dffffff", zone_name: "Kanakapura Road", price_sqft: 6900, why: "Same south corridor, 40% cheaper, Green Line metro running" },
      { zone_h3: "8a3d3a109ffffff", zone_name: "Bannerghatta Road", price_sqft: 8100, why: "Similar family profile, 15% cheaper, EC proximity" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "2BHK", sqft: 1100 }, { label: "3BHK", sqft: 1400 }, { label: "Row House", sqft: 1800 }],
    price_history: PH.premium_trad,
    rental_yield_pct: 2.9,
    developers: DEV.premium_trad,
    infra_pipeline: INFRA.premium_trad,
    neighborhood_stars: NB.premium_trad,
    simple_verdict: VERDICT.premium_trad,
    net_3yr_return_pct: NET3YR.premium_trad,
  },

  tech_est: {
    property_types: ["2BHK / 3BHK Flat", "Villa", "Row House"],
    best_for: "Tech professionals — live near work, strong ROI",
    buy_window: "now",
    buy_window_reason: "Metro operational or arriving within 12 months. Pre-metro pricing still available in pockets.",
    min_budget_sqft: 8500, typical_size_sqft: 1300, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
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
    docs_checklist: DOCS_APARTMENT,
    alt_zones: [
      { zone_h3: "8a3d3a2bdffffff", zone_name: "Dommasandra", price_sqft: 4900, why: "Sarjapur spillover, 50% cheaper, strong 3yr outperformer" },
      { zone_h3: "8a3d3a24dffffff", zone_name: "KR Puram",    price_sqft: 7100, why: "Metro now operational, east corridor, 25% cheaper" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "2BHK", sqft: 1100 }, { label: "3BHK", sqft: 1400 }, { label: "Villa", sqft: 2200 }],
    price_history: PH.tech_est,
    rental_yield_pct: 3.1,
    developers: DEV.tech_est,
    infra_pipeline: INFRA.tech_est,
    neighborhood_stars: NB.tech_est,
    simple_verdict: VERDICT.tech_est,
    net_3yr_return_pct: NET3YR.tech_est,
  },

  south_it: {
    property_types: ["2BHK Flat", "1BHK Flat"],
    best_for: "IT workers with budget constraint",
    buy_window: "6mo",
    buy_window_reason: "Metro Green Line extension DPR approved. Pre-metro pricing window closing.",
    min_budget_sqft: 7000, typical_size_sqft: 1000, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
    price_24m_change_pct: 19.2, price_momentum: "stable",
    risk_flood: 1, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Some low-lying areas near streams. Verify BDA drainage compliance.",
    risk_legal_note: "RERA density moderate. Verify project registration before booking.",
    risk_infra_note: "Metro extension DPR stage — 3–4yr execution risk.",
    metro_km: 3.8, metro_note: "Silk Board Purple Line 4km; Green Line ext planned 2028",
    hospital_km: 2.1, hospital_note: "BGS / Sparsh within 2km",
    school_km: 1.8, school_note: "Good school options within 2km",
    it_park_km: 1.2, it_park_note: "Electronic City Phase 1&2 within 1.5km",
    analyst_take: "Good affordability play for EC workers. Price advantage over Sarjapur/HSR is real. Buy flat now if workplace is EC or Bannerghatta. Metro will re-rate this.",
    docs_checklist: DOCS_APARTMENT,
    alt_zones: [
      { zone_h3: "8a3d3a12dffffff", zone_name: "Chandapura",    price_sqft: 3500, why: "EC next door, 55% cheaper, plot option available" },
      { zone_h3: "8a3d3a2baffffff", zone_name: "Attibele",      price_sqft: 3000, why: "SEZ proximity, cheapest entry in south corridor" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "1BHK", sqft: 650 }, { label: "2BHK", sqft: 1050 }, { label: "3BHK", sqft: 1350 }],
    price_history: PH.south_it,
    rental_yield_pct: 3.6,
    developers: DEV.south_it,
    infra_pipeline: INFRA.south_it,
    neighborhood_stars: NB.south_it,
    simple_verdict: VERDICT.south_it,
    net_3yr_return_pct: NET3YR.south_it,
  },

  west_mid: {
    property_types: ["2BHK Flat", "Plot", "Row House"],
    best_for: "Self-use + moderate appreciation; west commute users",
    buy_window: "6mo",
    buy_window_reason: "Mysore Road metro operational. NICE Road access improving. 6mo window left.",
    min_budget_sqft: 5800, typical_size_sqft: 1100, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
    price_24m_change_pct: 22.4, price_momentum: "stable",
    risk_flood: 0, risk_legal: 1, risk_infra: 0,
    risk_flood_note: "Generally low flood risk. Higher elevation than east Bangalore.",
    risk_legal_note: "Mixed — some peri-urban pockets have conversion issues. Insist on BDA/BMRDA approvals.",
    risk_infra_note: "Metro operational. NICE Road Phase 3 under tender. Low risk.",
    metro_km: 1.4, metro_note: "Purple Line Kengeri / Mysore Road station < 1.5km",
    hospital_km: 3.1, hospital_note: "BGS Gleneagles 3km",
    school_km: 1.9, school_note: "Schools available; fewer international options",
    it_park_km: 6.4, it_park_note: "Manyata via ORR ~7km; better for west-side employers",
    analyst_take: "Value zone. Underpriced relative to east Bangalore. Suits buyers working in Mysore Road/Peenya corridor. Plots here have 30%+ 3yr upside.",
    docs_checklist: DOCS_RESIDENTIAL_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a0d1ffffff", zone_name: "Kengeri Extension", price_sqft: 4400, why: "Metro Purple Line, 35% cheaper than Kanakapura Road" },
      { zone_h3: "8a3d3a051ffffff", zone_name: "Bidadi Smart City",  price_sqft: 2300, why: "Smart City gazetted, 3x upside thesis, plot entry" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "2BHK Flat", sqft: 1000 }, { label: "Plot 30×40", sqft: 1200 }, { label: "Row House", sqft: 1600 }],
    price_history: PH.west_mid,
    rental_yield_pct: 3.2,
    developers: DEV.west_mid,
    infra_pipeline: INFRA.west_mid,
    neighborhood_stars: NB.west_mid,
    simple_verdict: VERDICT.west_mid,
    net_3yr_return_pct: NET3YR.west_mid,
  },

  airport_north: {
    property_types: ["Plot", "Villa", "2BHK Flat"],
    best_for: "Plot investors — pre-airport appreciation play",
    buy_window: "now",
    buy_window_reason: "Airport Terminal 2 live. PRR North alignment confirmed. 12–18 month buy window before institutions price it up.",
    min_budget_sqft: 5000, typical_size_sqft: 1200, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
    price_24m_change_pct: 31.4, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "Low flood risk. North Bangalore drains away from city.",
    risk_legal_note: "Mix of RERA and direct land sales. For plots: verify DC conversion, BDA-approved layout. Avoid unapproved agricultural land.",
    risk_infra_note: "PRR + Metro Phase 3 confirmed but 3–4yr away. Buy for long horizon.",
    metro_km: 6.2, metro_note: "Phase 3 Yelahanka–Devanahalli planned 2028; Yelahanka 6km",
    hospital_km: 4.8, hospital_note: "Columbia Asia Hebbal 5km; local clinics only",
    school_km: 3.4, school_note: "Schools in Yelahanka / Devanahalli towns",
    it_park_km: 4.1, it_park_note: "KIAL Aerocity employment zone 4–6km; Manyata 12km",
    analyst_take: "Best risk/reward in this category is PLOTS. Airport Aerocity effect is proven (Devanahalli 5x since 2010). Buy 30x40 or 40x60 plots in BDA-approved layouts. 3yr flip potential is 40–60%.",
    docs_checklist: DOCS_RESIDENTIAL_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a319ffffff", zone_name: "Kogilu",  price_sqft: 5400, why: "Same north corridor, 30% cheaper than Yelahanka" },
      { zone_h3: "8a3d3a3b1ffffff", zone_name: "Bagalur", price_sqft: 4300, why: "8km from airport, frontier window open, higher risk/reward" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "2BHK Flat", sqft: 1100 }],
    price_history: PH.airport_north,
    rental_yield_pct: 1.8,
    developers: DEV.airport_north,
    infra_pipeline: INFRA.airport_north,
    neighborhood_stars: NB.airport_north,
    simple_verdict: VERDICT.airport_north,
    net_3yr_return_pct: NET3YR.airport_north,
  },

  east_emrg: {
    property_types: ["Plot", "Independent House", "Early-stage Flat"],
    best_for: "Investors with 3–5yr horizon; ORR/PRR play",
    buy_window: "now",
    buy_window_reason: "ORR extension tender finalised. IT spill-over from Whitefield beginning. 18-month window.",
    min_budget_sqft: 3800, typical_size_sqft: 1000, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 28.6, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "Low risk. Higher terrain than central east.",
    risk_legal_note: "Peri-urban pockets. Verify DC conversion & layout approval. Avoid agriculture-zone land.",
    risk_infra_note: "ORR extension funded, tender finalised. Moderate risk — 2026 completion.",
    metro_km: 8.4, metro_note: "Closest metro: Whitefield Purple Line 8–10km",
    hospital_km: 5.8, hospital_note: "Manipal Hospital Whitefield 6km",
    school_km: 4.2, school_note: "Schools sparse — gap is a risk for families",
    it_park_km: 4.8, it_park_note: "Prestige Tech Park / ITPB via ORR 5km",
    analyst_take: "Pure investor play, not for self-use yet. Buy plots in BDA-approved layouts at ₹3,800–4,500/sqft. ORR extension + IT spill-over = 40–55% 3yr appreciation.",
    docs_checklist: DOCS_RESIDENTIAL_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a2e1ffffff", zone_name: "Hoskote",  price_sqft: 3200, why: "ORR endpoint, 35% cheaper than Dommasandra" },
      { zone_h3: "8a3d3a2baffffff", zone_name: "Attibele", price_sqft: 3000, why: "Bangalore–TN border, cheapest in east corridor" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Ind. House", sqft: 1000 }],
    price_history: PH.east_emrg,
    rental_yield_pct: 0.8,
    developers: DEV.east_emrg,
    infra_pipeline: INFRA.east_emrg,
    neighborhood_stars: NB.east_emrg,
    simple_verdict: VERDICT.east_emrg,
    net_3yr_return_pct: NET3YR.east_emrg,
  },

  south_emrg: {
    property_types: ["Plot", "Independent House"],
    best_for: "Industrial corridor play; long-horizon plot investors",
    buy_window: "12mo",
    buy_window_reason: "KIADB Phase 3 allocation beginning. NICE Road Phase 3 under tender. 12-month lead window.",
    min_budget_sqft: 3200, typical_size_sqft: 900, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 24.1, price_momentum: "stable",
    risk_flood: 1, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "Some low-lying terrain near Hulimangala. Check elevation before buying.",
    risk_legal_note: "Agricultural land conversion ongoing. Insist on DC conversion order & BDA approval.",
    risk_infra_note: "KIADB and NICE Road dependent. Timeline risk is moderate.",
    metro_km: 10.2, metro_note: "No metro planned within 5yr for this zone",
    hospital_km: 6.4, hospital_note: "Narayana Hrudayalaya Electronic City 6km",
    school_km: 5.1, school_note: "Very limited schooling — major gap for families",
    it_park_km: 5.8, it_park_note: "Electronic City Phase 2 / Jigani KIADB 6km",
    analyst_take: "Industrial corridor play. Best for pure land banking with 5yr+ horizon. Not self-use ready.",
    docs_checklist: DOCS_RESIDENTIAL_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a2baffffff", zone_name: "Attibele",   price_sqft: 3000, why: "SEZ border zone, cheapest south option" },
      { zone_h3: "8a3d3a12dffffff", zone_name: "Chandapura", price_sqft: 3500, why: "EC adjacent, similar profile, slightly better infra" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Ind. House", sqft: 900 }],
    price_history: PH.south_emrg,
    rental_yield_pct: 0.5,
    developers: DEV.south_emrg,
    infra_pipeline: INFRA.south_emrg,
    neighborhood_stars: NB.south_emrg,
    simple_verdict: VERDICT.south_emrg,
    net_3yr_return_pct: NET3YR.south_emrg,
  },

  frontier_north: {
    property_types: ["Plot (30×40, 40×60, 60×40)"],
    best_for: "Maximum ROI land banking — airport / SEZ anchor",
    buy_window: "now",
    buy_window_reason: "KIAL T2 live. Aerocity SEZ notified. Institutional money arriving in 6–12 months. Last window at current prices.",
    min_budget_sqft: 2200, typical_size_sqft: 1200, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 38.2, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "Low flood risk. North Bangalore peripheral terrain drains well.",
    risk_legal_note: "ONLY buy BDA/KIADB/BIAAPA-approved layouts. Demand A-Khata and DC conversion documents. Many unapproved pockets exist.",
    risk_infra_note: "HIGH: thesis is 100% airport + infra dependent. PRR or SEZ delays extend timeline 3–5yr.",
    metro_km: 10.4, metro_note: "Metro Phase 3 planned but 4–5yr away. Don't price it in.",
    hospital_km: 7.8, hospital_note: "Nearest major hospital 8–10km. Not self-use ready.",
    school_km: 6.8, school_note: "Very limited. Not a family zone yet.",
    it_park_km: 5.2, it_park_note: "KIAL Aerocity / Aerospace SEZ 5–8km",
    analyst_take: "HIGHEST return, HIGHEST patience required. Buy 30×40 BDA-approved plots now. Do NOT buy unapproved agricultural land. Target: 2x in 5 years. Investment money only.",
    docs_checklist: DOCS_FRONTIER_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a351ffffff", zone_name: "Doddaballapur Road",  price_sqft: 2700, why: "Same north axis, 35% cheaper than Bagalur, less crowded" },
      { zone_h3: "8a3d3a3e1ffffff", zone_name: "Nandi Hills Corridor", price_sqft: 1700, why: "Cheapest in north, scenic premium potential, very long horizon" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Plot 60×40", sqft: 2400 }],
    price_history: PH.frontier_north,
    rental_yield_pct: 0,
    developers: DEV.frontier_north,
    infra_pipeline: INFRA.frontier_north,
    neighborhood_stars: NB.frontier_north,
    simple_verdict: VERDICT.frontier_north,
    net_3yr_return_pct: NET3YR.frontier_north,
  },

  frontier_west: {
    property_types: ["Plot (40×60, 60×80)"],
    best_for: "Industrial NIMZ / Smart City land banking",
    buy_window: "now",
    buy_window_reason: "Dabaspet NIMZ Phase 1 operational. Bidadi Smart City gazetted. First-mover window open.",
    min_budget_sqft: 1800, typical_size_sqft: 1200, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 42.8, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "Low risk. Tumkur/Mysore Road corridors at good elevation.",
    risk_legal_note: "Buy only KIADB-notified or BMRDA-approved layouts. Avoid private unapproved layouts.",
    risk_infra_note: "HIGH: full thesis depends on NIMZ/Smart City execution. GoI/GoK backed reduces (not eliminates) risk.",
    metro_km: 14.2, metro_note: "No metro — Tumkur/Mysore Road corridors are bus/road-dependent",
    hospital_km: 9.1, hospital_note: "City hospitals 30–45min drive. Pure investment zone.",
    school_km: 8.4, school_note: "No quality schools yet. Not for immediate residential use.",
    it_park_km: 12.8, it_park_note: "Industrial employment (Toyota, manufacturing) closer than IT parks",
    analyst_take: "Pure land banking play for investors with 5–7yr horizon. Minimum ticket ₹15–25L. NIMZ and Smart City are government-backed anchors. Don't bet more than 15–20% of portfolio here.",
    docs_checklist: DOCS_FRONTIER_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a051ffffff", zone_name: "Bidadi Smart City",  price_sqft: 2300, why: "Smart City catalysts, more near-term upside than NIMZ" },
      { zone_h3: "8a3d3a059ffffff", zone_name: "Hesaraghatta",       price_sqft: 2200, why: "Eco-zone, different demand driver, periphery play" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Plot 60×80", sqft: 4800 }],
    price_history: PH.frontier_west,
    rental_yield_pct: 0,
    developers: DEV.frontier_west,
    infra_pipeline: INFRA.frontier_west,
    neighborhood_stars: NB.frontier_west,
    simple_verdict: VERDICT.frontier_west,
    net_3yr_return_pct: NET3YR.frontier_west,
  },
};

// ─── Zone-specific overrides ──────────────────────────────────────────────────
const ZONE_BRIEF: Record<string, BuyerBrief> = {
  "8a3d3a2c9ffffff": { // Whitefield
    property_types: ["2BHK / 3BHK Flat", "Villa Township"],
    best_for: "IT professionals — live 400m from office",
    buy_window: "now",
    buy_window_reason: "Purple Line metro opened. Pre-metro price discovery already happened. Buy before ITPB Phase 4 expansion drives next leg.",
    min_budget_sqft: 9000, typical_size_sqft: 1300, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
    price_24m_change_pct: 29.6, price_momentum: "accelerating",
    risk_flood: 1, risk_legal: 0, risk_infra: 0,
    risk_flood_note: "Varthur and Bellandur lakes are flood risk vectors. Ask builder for BDA drainage clearance certificate before booking.",
    risk_legal_note: "RERA compliance very high in Whitefield. Large township projects (Prestige, Sobha, Brigade) all clear.",
    risk_infra_note: "Metro operational. ORR signal-free corridor live. Infrastructure fully in place.",
    metro_km: 0.8, metro_note: "Whitefield Purple Line station now open",
    hospital_km: 3.2, hospital_note: "Sakra World Hospital 3km; Manipal Whitefield 4km",
    school_km: 1.1, school_note: "Inventure Academy 1km; Greenwood High 1.5km",
    it_park_km: 0.4, it_park_note: "ITPB / Prestige Tech Park walkable — 400m",
    analyst_take: "Best flat purchase in east Bangalore. Metro + top IT park walkability is rare. Buy 3BHK 1,400 sqft at ₹9,500–10,500/sqft. Rental yield 2.8–3.2% while holding. 3yr appreciation: 28–35%.",
    docs_checklist: DOCS_APARTMENT,
    alt_zones: [
      { zone_h3: "8a3d3a24dffffff", zone_name: "KR Puram",    price_sqft: 7100, why: "Metro now live, east corridor, 25% cheaper" },
      { zone_h3: "8a3d3a28dffffff", zone_name: "Marathahalli", price_sqft: 8900, why: "ORR access, 15% cheaper, similar IT corridor" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "2BHK", sqft: 1100 }, { label: "3BHK", sqft: 1400 }, { label: "Villa Township", sqft: 2200 }],
    price_history: [{ year:2020, price_sqft:5800 },{ year:2021, price_sqft:6200 },{ year:2022, price_sqft:7000 },{ year:2023, price_sqft:8200 },{ year:2024, price_sqft:9100 },{ year:2025, price_sqft:9800 }],
    rental_yield_pct: 2.9,
    developers: ["Prestige Group", "Sobha Realty", "Salarpuria Sattva", "Brigade Group"],
    infra_pipeline: [
      { name: "Metro Purple Line fully operational",    year: 2025, impact: "high", done: true },
      { name: "ITPB Phase 4 — 18,000 seats",           year: 2026, impact: "high" },
      { name: "ORR Marathahalli–Sarjapur signal-free",  year: 2027, impact: "high" },
      { name: "Varthur lake rejuvenation (BBMP STP)",   year: 2026, impact: "medium" },
    ],
    neighborhood_stars: [
      { label: "Connectivity",  stars: 5, note: "Metro open, ORR live, cabs abundant" },
      { label: "Schools",       stars: 4, note: "Inventure Academy, Greenwood High within 1.5km" },
      { label: "Healthcare",    stars: 3, note: "Sakra 3km, Manipal 4km — adequate" },
      { label: "Safety",        stars: 4, note: "Gated communities, ITPB security zone" },
      { label: "Livability",    stars: 3, note: "Peak-hour traffic remains issue. Metro helping." },
    ],
    simple_verdict: "Best flat to buy in east Bangalore right now. Metro + walkable IT park is a rare combination. Your money is safe here and will grow well.",
    net_3yr_return_pct: 11.8,
  },

  "8a3d3a3a1ffffff": { // Devanahalli Aerospace
    property_types: ["Plot (30×40, 40×60)", "Villa in Gated Township"],
    best_for: "Airport-city appreciation — highest ROI in Bangalore",
    buy_window: "now",
    buy_window_reason: "KIAL T2 live (55M capacity). Aerospace Park Phase 2 SEZ notified. 3–6 month window before developer price revision.",
    min_budget_sqft: 8000, typical_size_sqft: 1200, stamp_duty_pct: 5.6, registration_pct: REG_PCT,
    price_24m_change_pct: 44.2, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 1,
    risk_flood_note: "No flood risk. High elevation, north Bangalore, drains away from city.",
    risk_legal_note: "ONLY buy BDA-approved or BIAAPA-approved layouts. Aerocity zone land has complex titles — use a reputed RERA-registered developer.",
    risk_infra_note: "Airport is live, but direct road links (STRR spur, Metro) are 3–4yr away.",
    metro_km: 12.1, metro_note: "Metro Phase 3 Devanahalli planned ~2028–2029",
    hospital_km: 8.4, hospital_note: "Columbia Asia Hebbal 28km; local health centre only — NOT for families with medical needs",
    school_km: 5.2, school_note: "Schools in Devanahalli town 5km",
    it_park_km: 4.1, it_park_note: "Aerospace Park SEZ 4km; Manyata Tech 28km",
    analyst_take: "Highest conviction buy in Bangalore. Devanahalli prices went 5x in 10 years post-airport. Phase 2 (Aerospace SEZ + Aerocity) is the next catalyst. Legal homework is the only risk here.",
    docs_checklist: DOCS_FRONTIER_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a3b1ffffff", zone_name: "Bagalur",              price_sqft: 4300, why: "8km from airport, 46% cheaper, similar upside thesis" },
      { zone_h3: "8a3d3a3d1ffffff", zone_name: "Sompura Gate (KIADB)", price_sqft: 2500, why: "KIADB zone, 69% cheaper, 5yr+ horizon" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Villa Township", sqft: 1500 }],
    price_history: [{ year:2020, price_sqft:3200 },{ year:2021, price_sqft:3900 },{ year:2022, price_sqft:5100 },{ year:2023, price_sqft:6500 },{ year:2024, price_sqft:7800 },{ year:2025, price_sqft:8600 }],
    rental_yield_pct: 0,
    developers: ["Sobha Realty", "Shriram Properties", "BIAAPA Aerocity (plotted)", "Assetz Property"],
    infra_pipeline: [
      { name: "KIAL Terminal 2 operational (55M cap)", year: 2024, impact: "high", done: true },
      { name: "Aerospace Park Phase 2 SEZ notified",   year: 2025, impact: "high", done: true },
      { name: "BIAL Aerocity master plan revised",     year: 2026, impact: "high" },
      { name: "STRR–Aerocity direct link road",        year: 2027, impact: "high" },
      { name: "Metro Phase 3 to Devanahalli",         year: 2029, impact: "high" },
    ],
    neighborhood_stars: [
      { label: "Connectivity",  stars: 2, note: "Road access via Bellary Road/NH44. Metro 4yr away." },
      { label: "Schools",       stars: 2, note: "Devanahalli town schools 5km away" },
      { label: "Healthcare",    stars: 1, note: "28km to nearest major hospital — serious emergency risk" },
      { label: "Safety",        stars: 4, note: "Airport zone, low crime, security presence" },
      { label: "Livability",    stars: 1, note: "Investment zone only. Do not move here yet." },
    ],
    simple_verdict: "Best investment land in Bangalore. The airport already doubled in size. This is like buying near Devanahalli before it boomed in 2010. For investment only — do NOT move here yet.",
    net_3yr_return_pct: 36.4,
  },

  "8a3d3a3b1ffffff": { // Bagalur
    property_types: ["Plot (30×40, 40×60, 60×40)"],
    best_for: "Highest potential ROI — 8km from airport, pre-discovery",
    buy_window: "now",
    buy_window_reason: "KIAL 8km direct. Link road approved and construction started. Institutional money beginning. Last cheap window — 6–9 months.",
    min_budget_sqft: 4000, typical_size_sqft: 1200, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 38.6, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "No flood risk. Bagalur is at high elevation — no lake adjacency.",
    risk_legal_note: "CRITICAL: Only buy DC-converted BDA-approved layouts. Reputed developers: Shriram, JK Group, Assetz. Reject anything without A-Khata.",
    risk_infra_note: "HIGH: link road is approved but 2yr away. Metro is 4–5yr plan. Position at 15–20% of portfolio max.",
    metro_km: 13.2, metro_note: "No metro in zone; KIAL Terminal as employer anchor instead",
    hospital_km: 8.8, hospital_note: "Columbia Asia 30km — NOT a residential self-use zone",
    school_km: 6.4, school_note: "No schools — pure investment zone",
    it_park_km: 4.8, it_park_note: "Bagalur–KIAL Aerocity zone 5km; aerospace SEZ 6km",
    analyst_take: "Highest potential right now. ₹4,000–4,500/sqft = ₹19–22L for a 30×40 plot. 3yr target: ₹7,000–8,000/sqft. ONLY BDA-approved layouts. Title is everything here.",
    docs_checklist: DOCS_FRONTIER_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a351ffffff", zone_name: "Doddaballapur Road",   price_sqft: 2700, why: "Same north axis, 33% cheaper, less crowded" },
      { zone_h3: "8a3d3a3d1ffffff", zone_name: "Sompura Gate (KIADB)", price_sqft: 2500, why: "KIADB-notified zone, 38% cheaper, lower legal risk" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Plot 60×40", sqft: 2400 }],
    price_history: [{ year:2020, price_sqft:1600 },{ year:2021, price_sqft:2000 },{ year:2022, price_sqft:2600 },{ year:2023, price_sqft:3200 },{ year:2024, price_sqft:3900 },{ year:2025, price_sqft:4500 }],
    rental_yield_pct: 0,
    developers: DEV.frontier_north,
    infra_pipeline: [
      { name: "Aerospace Park Phase 2 SEZ notified", year: 2025, impact: "high", done: true },
      { name: "Bagalur–KIAL 4-lane direct link road", year: 2026, impact: "high" },
      { name: "BMTC airport routes +3.2x frequency",  year: 2025, impact: "medium", done: true },
      { name: "STRR North highway spur",              year: 2027, impact: "high" },
    ],
    neighborhood_stars: NB.frontier_north,
    simple_verdict: "The most exciting land buy in Bangalore right now. 8km from the airport, price not yet discovered. Like buying in Whitefield in 2004. For investors only — families cannot live here yet.",
    net_3yr_return_pct: 38.2,
  },

  "8a3d3a041ffffff": { // Dabaspet NIMZ
    property_types: ["Industrial Plot", "Residential Plot (near NIMZ periphery)"],
    best_for: "Industrial corridor land banking — 5–7yr horizon",
    buy_window: "now",
    buy_window_reason: "NIMZ Phase 1 operational — first 38 manufacturing units allotted. Phase 2 land bank cleared. Residential plot prices haven't caught up yet.",
    min_budget_sqft: 1700, typical_size_sqft: 1200, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 48.2, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "No flood risk. Tumkur Road corridor is high elevation.",
    risk_legal_note: "ONLY KIADB-notified plots or BMRDA-approved layouts for residential. Avoid private unapproved layouts.",
    risk_infra_note: "HIGH: full upside is NIMZ execution dependent. Phase 1 delivered. Phase 2 is GoI-backed. Still a 5–7yr play.",
    metro_km: 18.4, metro_note: "No metro planned for this corridor within 5yr",
    hospital_km: 9.2, hospital_note: "City hospitals in Nelamangala 9km — NOT for immediate residential use",
    school_km: 8.1, school_note: "Not a family zone yet",
    it_park_km: 14.2, it_park_note: "Manufacturing/industrial employment vs IT — different demand profile",
    analyst_take: "Pure land banking. ₹1,700–2,000/sqft at NIMZ periphery = ₹12–15L for a 60×40 plot. This is a 5–7yr play not 3yr. Conservative sizing: ₹10–20L bracket.",
    docs_checklist: DOCS_FRONTIER_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a051ffffff", zone_name: "Bidadi Smart City", price_sqft: 2300, why: "Same west corridor, Smart City catalysts, more residential demand" },
      { zone_h3: "8a3d3a059ffffff", zone_name: "Hesaraghatta",      price_sqft: 2200, why: "Eco-zone, different driver, adjacent peripheral area" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 40×60", sqft: 2400 }, { label: "Plot 60×80", sqft: 4800 }, { label: "Plot 30×40", sqft: 1200 }],
    price_history: [{ year:2020, price_sqft:700 },{ year:2021, price_sqft:900 },{ year:2022, price_sqft:1200 },{ year:2023, price_sqft:1600 },{ year:2024, price_sqft:2000 },{ year:2025, price_sqft:2200 }],
    rental_yield_pct: 0,
    developers: DEV.frontier_west,
    infra_pipeline: INFRA.frontier_west,
    neighborhood_stars: NB.frontier_west,
    simple_verdict: "Government factories (NIMZ) are already running here. Very early stage. Your money could triple in 7 years. But this is only for people who can wait and don't need the money soon.",
    net_3yr_return_pct: 42.2,
  },

  "8a3d3a051ffffff": { // Bidadi Smart City
    property_types: ["Plot (30×40, 40×60)", "Plotted Development"],
    best_for: "Smart city ground-floor entry — Mysore Road corridor",
    buy_window: "now",
    buy_window_reason: "Smart City master plan gazetted June 2025. Toyota expansion confirmed (2,500 new jobs). Godrej acquired 120 acres. Developer money arriving. 6-month first-mover window.",
    min_budget_sqft: 2100, typical_size_sqft: 1200, stamp_duty_pct: 3.0, registration_pct: REG_PCT,
    price_24m_change_pct: 52.4, price_momentum: "accelerating",
    risk_flood: 0, risk_legal: 1, risk_infra: 2,
    risk_flood_note: "Low risk. Mysore Road corridor is well above flood plains.",
    risk_legal_note: "Smart City zone plots: BMRDA-approved only. Prefer reputed developers in first phase.",
    risk_infra_note: "HIGH: Smart City master plan just gazetted. Metro spur is a proposal (DPR Dec 2025).",
    metro_km: 16.8, metro_note: "Metro spur proposed; DPR Dec 2025; 5–6yr to station",
    hospital_km: 8.4, hospital_note: "Mysore Road has limited healthcare; city hospitals 35km",
    school_km: 7.2, school_note: "Schools planned in master plan but not yet built",
    it_park_km: 16.2, it_park_note: "Not an IT corridor — Toyota/manufacturing employment base",
    analyst_take: "Bidadi is a 3x play in 5yr if Smart City executes. Buy ₹2,000–2,300/sqft in BMRDA-approved layouts. Total outlay: ₹15–20L for 600 sqft. Comparable: Whitefield 2004. High conviction, high patience.",
    docs_checklist: DOCS_FRONTIER_PLOT,
    alt_zones: [
      { zone_h3: "8a3d3a041ffffff", zone_name: "Dabaspet NIMZ",    price_sqft: 1900, why: "NIMZ anchor, same west corridor, 10% cheaper" },
      { zone_h3: "8a3d3a0d1ffffff", zone_name: "Kengeri Extension", price_sqft: 4400, why: "Metro accessible, better near-term liquidity" },
    ],
    tax_note: TAX_NOTE,
    sizes: [{ label: "Plot 30×40", sqft: 1200 }, { label: "Plot 40×60", sqft: 2400 }, { label: "Plot 60×40", sqft: 2400 }],
    price_history: [{ year:2020, price_sqft:800 },{ year:2021, price_sqft:1000 },{ year:2022, price_sqft:1400 },{ year:2023, price_sqft:1800 },{ year:2024, price_sqft:2400 },{ year:2025, price_sqft:2600 }],
    rental_yield_pct: 0,
    developers: ["Godrej Properties", "Prestige Group", "TVS Housing", "Shriram"],
    infra_pipeline: INFRA.frontier_west,
    neighborhood_stars: NB.frontier_west,
    simple_verdict: "Government is building a new Smart City here and Toyota already made it home. Very early but very exciting. Buy ₹15–20L worth of plots now. Results in 5–7 years.",
    net_3yr_return_pct: 40.1,
  },
};
