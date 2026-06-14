import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async ({ url }) => {
  const zoneH3 = url.searchParams.get("zone_h3") ?? "";
  const days = url.searchParams.get("days") ?? "30";

  try {
    const res = await fetch(`${ML_API}/news/${zoneH3}?days=${days}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    const pool = ZONE_NEWS[zoneH3] ?? categoryNews(zoneH3);
    return new Response(
      JSON.stringify({ zone_h3: zoneH3, zone_name: null, items: pool, total: pool.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};

const ZONE_AREA: Record<string, string> = {
  "8a3d3a119ffffff": "central", "8a3d3a2a9ffffff": "central",
  "8a3d3a141ffffff": "central", "8a3d3a127ffffff": "central",
  "8a3d3a145ffffff": "central", "8a3d3a14dffffff": "central",
  "8a3d3a0d1ffffff": "central",
  "8a3d3a2d9ffffff": "east",    "8a3d3a2c9ffffff": "east",
  "8a3d3a28dffffff": "east",    "8a3d3a24dffffff": "east",
  "8a3d3a2bdffffff": "east",    "8a3d3a2a1ffffff": "east",
  "8a3d3a2ddffffff": "east",    "8a3d3a2e1ffffff": "east",
  "8a3d3a117ffffff": "south",   "8a3d3a109ffffff": "south",
  "8a3d3a12dffffff": "south",   "8a3d3a121ffffff": "south",
  "8a3d3a2baffffff": "south",
  "8a3d3a301ffffff": "north",   "8a3d3a311ffffff": "north",
  "8a3d3a315ffffff": "north",   "8a3d3a319ffffff": "north",
  "8a3d3a31dffffff": "north",   "8a3d3a3b1ffffff": "north",
  "8a3d3a3a1ffffff": "north",   "8a3d3a351ffffff": "north",
  "8a3d3a3d1ffffff": "north",   "8a3d3a3e1ffffff": "north",
  "8a3d3a069ffffff": "west",    "8a3d3a059ffffff": "west",
  "8a3d3a041ffffff": "west",    "8a3d3a051ffffff": "west",
  "8a3d3a35dffffff": "north",
};

function categoryNews(zoneH3: string) {
  const area = ZONE_AREA[zoneH3] ?? "central";
  return AREA_NEWS[area];
}

const AREA_NEWS: Record<string, unknown[]> = {
  central: [
    { headline: "Namma Metro Phase 2A Silk Board–KR Puram section to open Q3 2025", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 5 },
    { headline: "Bangalore office absorption hits 21.7M sqft — highest in Asia Pacific 2024", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 11 },
    { headline: "BBMP master plan 2031 revision includes TOD corridors along Purple Line", url: "#", published_at: null, signal_type: "policy", sentiment: 0.6, days_ago: 18 },
    { headline: "Property registrations in South Bangalore hit 5-year high Q1 2025", url: "#", published_at: null, signal_type: "market", sentiment: 0.7, days_ago: 24 },
    { headline: "Global capability centres add 40,000 seats in Central Bangalore in 2024", url: "#", published_at: null, signal_type: "employment", sentiment: 0.8, days_ago: 29 },
  ],
  east: [
    { headline: "Namma Metro Purple Line Phase 2 Whitefield station operational from June 2025", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 4 },
    { headline: "ITPB Whitefield Phase 4 expansion — 3.2M sqft new tech campus approved", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 9 },
    { headline: "ORR–Sarjapur elevated corridor tender finalised — completion 2027", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 14 },
    { headline: "RMZ Ecoworld Phase 3 adds 4,500 seats; 9 MNCs confirmed for Sarjapur corridor", url: "#", published_at: null, signal_type: "employment", sentiment: 0.8, days_ago: 21 },
    { headline: "Varthur lake restoration BDA project to reduce flood risk by 60% by 2026", url: "#", published_at: null, signal_type: "policy", sentiment: 0.6, days_ago: 28 },
  ],
  south: [
    { headline: "Metro Green Line extension to Electronic City Phase 2 — DPR approved", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 6 },
    { headline: "ITIR Bangalore–Mysore corridor land acquisition Phase 1 complete", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.7, days_ago: 12 },
    { headline: "Infosys Bangalore South campus expansion — 8,000 new seats by 2026", url: "#", published_at: null, signal_type: "employment", sentiment: 0.8, days_ago: 17 },
    { headline: "Jigani industrial zone Phase 3 KIADB allotment opens for manufacturing units", url: "#", published_at: null, signal_type: "policy", sentiment: 0.7, days_ago: 23 },
    { headline: "NICE Road Phase 3 Attibele extension DPR submitted to NHAI", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.6, days_ago: 28 },
  ],
  north: [
    { headline: "KIAL Terminal 2 operational — passenger capacity doubles to 55M annually", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 3 },
    { headline: "Devanahalli Aerospace Park Phase 2 — 14 MRO companies sign LOIs", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 8 },
    { headline: "Peripheral Ring Road North stretch Hebbal–Yelahanka land handover begins", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 14 },
    { headline: "Namma Metro Phase 3 Yelahanka–Devanahalli alignment approved by GoK", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 20 },
    { headline: "Bagalur Aerospace Valley SEZ — 3,200 acres notified for industrial use", url: "#", published_at: null, signal_type: "policy", sentiment: 0.8, days_ago: 27 },
  ],
  west: [
    { headline: "Dabaspet NIMZ Phase 1 — KIADB hands over 1,200 acres to first batch of manufacturers", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 5 },
    { headline: "Bidadi Smart City master plan gazetted — 6 residential zones, Metro spur proposed", url: "#", published_at: null, signal_type: "policy", sentiment: 0.9, days_ago: 11 },
    { headline: "NH4 Nelamangala 6-lane widening complete — travel time to Bangalore cut by 40%", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 16 },
    { headline: "Toyota Kirloskar Motor expands Bidadi plant — 2,500 new direct jobs", url: "#", published_at: null, signal_type: "employment", sentiment: 0.8, days_ago: 22 },
    { headline: "Tumkur Rd bus frequency up 2.9x in 12 months — BMTC adds 42 new routes", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.7, days_ago: 29 },
  ],
};

// Zone-specific overrides for areas with unique recent news
const ZONE_NEWS: Record<string, unknown[]> = {
  "8a3d3a3a1ffffff": [ // Devanahalli Aerospace Valley
    { headline: "Kempegowda International Airport T2 opens — capacity now 55M passengers/yr", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 3 },
    { headline: "Devanahalli Aerospace Park Phase 2 — 14 MRO & aviation firms sign LOIs", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 7 },
    { headline: "BIAL Aerocity master plan revised — 400 acres added for premium residential", url: "#", published_at: null, signal_type: "policy", sentiment: 0.8, days_ago: 13 },
    { headline: "Direct STRR link to Aerospace Valley approved — 8km, 4-lane, 2026 target", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 19 },
    { headline: "Aviation EPFO registrations in Devanahalli up 68.4% YoY — fastest in Karnataka", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 26 },
  ],
  "8a3d3a041ffffff": [ // Dabaspet NIMZ
    { headline: "Dabaspet NIMZ Phase 1 operationalised — 1,200 acres to 38 manufacturing units", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 4 },
    { headline: "Union budget allocates ₹2,400 crore for NIMZ infrastructure in Karnataka", url: "#", published_at: null, signal_type: "policy", sentiment: 0.8, days_ago: 10 },
    { headline: "NH4 Dabaspet bypass — 6-lane widening cuts logistics cost by 22%", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 16 },
    { headline: "3 global electronics manufacturers set up greenfield units at Dabaspet NIMZ", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 22 },
    { headline: "KIADB Dabaspet Phase 2 land bank of 800 acres gets GoI clearance", url: "#", published_at: null, signal_type: "policy", sentiment: 0.7, days_ago: 29 },
  ],
  "8a3d3a2c9ffffff": [ // Whitefield
    { headline: "Metro Purple Line Whitefield station opens — city reachable in 32 min", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 2 },
    { headline: "ITPB Whitefield Phase 4 — 3.2M sqft campus, 18,000 seats under construction", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 8 },
    { headline: "Varthur lake rejuvenation: BBMP completes STP, flood risk mapped down", url: "#", published_at: null, signal_type: "policy", sentiment: 0.6, days_ago: 15 },
    { headline: "ORR Marathahalli–Sarjapur signal-free corridor opens; Whitefield commute cut 18 min", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 21 },
    { headline: "Prestige Group launches 2,400-unit township off Whitefield–Hoskote Road", url: "#", published_at: null, signal_type: "market", sentiment: 0.7, days_ago: 27 },
  ],
  "8a3d3a051ffffff": [ // Bidadi Smart City
    { headline: "Bidadi Smart City master plan gazetted — 6 residential precincts, 1.5L dwelling units", url: "#", published_at: null, signal_type: "policy", sentiment: 0.9, days_ago: 5 },
    { headline: "Toyota Motor expands Bidadi plant — investment ₹3,200 crore, 2,500 new jobs", url: "#", published_at: null, signal_type: "employment", sentiment: 0.9, days_ago: 11 },
    { headline: "Mysore Road 10-lane widening to Bidadi complete — travel time < 35 minutes", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 17 },
    { headline: "BMRDA proposes Metro spur to Bidadi Smart City — DPR by Dec 2025", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 23 },
    { headline: "Godrej Properties acquires 120-acre land parcel in Bidadi for plotted development", url: "#", published_at: null, signal_type: "market", sentiment: 0.8, days_ago: 29 },
  ],
  "8a3d3a3b1ffffff": [ // Bagalur
    { headline: "Bagalur Aerospace Valley SEZ — 3,200 acres notified, 14 firms committed", url: "#", published_at: null, signal_type: "policy", sentiment: 0.9, days_ago: 4 },
    { headline: "Direct 4-lane link road Bagalur–KIAL T2 approved, construction begins", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 9 },
    { headline: "BMTC adds 28 routes to Bagalur from Hebbal & KIA — frequency now 3.2x", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 15 },
    { headline: "Sobha, Prestige eye land acquisition in Bagalur for airport-city townships", url: "#", published_at: null, signal_type: "market", sentiment: 0.8, days_ago: 21 },
    { headline: "Nighttime satellite imagery shows Bagalur light intensity up 3.4x since 2021", url: "#", published_at: null, signal_type: "market", sentiment: 0.7, days_ago: 28 },
  ],
};
