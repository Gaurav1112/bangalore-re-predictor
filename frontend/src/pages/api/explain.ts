import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async ({ url }) => {
  const zoneH3 = url.searchParams.get("zone_h3") ?? "";
  const topN = url.searchParams.get("top_n") ?? "5";

  try {
    const res = await fetch(`${ML_API}/explain/${zoneH3}?top_n=${topN}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify(mockExplain(zoneH3)), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

function mockExplain(zoneH3: string) {
  const signals = SIGNALS[zoneH3] ?? categorySignals(zoneH3);
  return { zone_h3: zoneH3, zone_name: null, top_signals: signals };
}

// Derive category from zone H3 → use appropriate template signals
function categorySignals(zoneH3: string) {
  const cat = ZONE_CATEGORY[zoneH3] ?? "frontier";
  return CATEGORY_SIGNALS[cat];
}

// Zone → category mapping for all 35 zones
const ZONE_CATEGORY: Record<string, string> = {
  "8a3d3a119ffffff": "premium",      // Koramangala
  "8a3d3a2a9ffffff": "premium",      // Indiranagar
  "8a3d3a141ffffff": "premium_trad", // JP Nagar
  "8a3d3a127ffffff": "tech_est",     // HSR Layout
  "8a3d3a2d9ffffff": "tech_est",     // Sarjapur Road
  "8a3d3a2c9ffffff": "tech_est",     // Whitefield
  "8a3d3a28dffffff": "tech_est",     // Marathahalli
  "8a3d3a117ffffff": "south_it",     // Electronic City
  "8a3d3a109ffffff": "south_it",     // Bannerghatta Road
  "8a3d3a145ffffff": "premium_trad", // Banashankari
  "8a3d3a301ffffff": "airport_north",// Hebbal
  "8a3d3a311ffffff": "airport_north",// Yelahanka
  "8a3d3a315ffffff": "airport_north",// Thanisandra
  "8a3d3a24dffffff": "tech_est",     // KR Puram
  "8a3d3a14dffffff": "west_mid",     // Kanakapura Road
  "8a3d3a319ffffff": "airport_north",// Kogilu
  "8a3d3a31dffffff": "airport_north",// Rajanukunte
  "8a3d3a2bdffffff": "east_emrg",   // Dommasandra
  "8a3d3a2a1ffffff": "east_emrg",   // Virgonagar
  "8a3d3a12dffffff": "south_emrg",  // Chandapura
  "8a3d3a0d1ffffff": "west_mid",    // Kengeri Extension
  "8a3d3a121ffffff": "south_emrg",  // Jigani Phase 3
  "8a3d3a2baffffff": "south_emrg",  // Attibele
  "8a3d3a3b1ffffff": "frontier_north", // Bagalur
  "8a3d3a2ddffffff": "east_emrg",   // Budigere Cross
  "8a3d3a2e1ffffff": "east_emrg",   // Hoskote
  "8a3d3a3a1ffffff": "frontier_north", // Devanahalli Aerospace
  "8a3d3a069ffffff": "frontier_west",  // Nelamangala
  "8a3d3a059ffffff": "frontier_west",  // Hesaraghatta
  "8a3d3a351ffffff": "frontier_north", // Doddaballapur Road
  "8a3d3a051ffffff": "frontier_west",  // Bidadi Smart City
  "8a3d3a041ffffff": "frontier_west",  // Dabaspet NIMZ
  "8a3d3a3e1ffffff": "frontier_north", // Nandi Hills Corridor
  "8a3d3a3d1ffffff": "frontier_north", // Sompura Gate
  "8a3d3a35dffffff": "airport_north",  // Kogilu North (35th zone)
};

// Category-level signal templates
const CATEGORY_SIGNALS: Record<string, unknown[]> = {
  premium: [
    { feature: "retail_density",  label: "Premium retail & F&B density",   shap_value:  0.138, direction: "positive", feature_value: 96,    pts: 13.8 },
    { feature: "it_park_dist_m",  label: "IT park proximity",              shap_value:  0.112, direction: "positive", feature_value: 1100,  pts: 11.2 },
    { feature: "price_level",     label: "High base price drag on ROI",    shap_value: -0.141, direction: "negative", feature_value: 15000, pts: 14.1 },
    { feature: "supply_pipeline", label: "New supply in pipeline",         shap_value: -0.064, direction: "negative", feature_value: 4800,  pts: 6.4  },
    { feature: "congestion_idx",  label: "Traffic congestion penalty",     shap_value: -0.044, direction: "negative", feature_value: 8.6,   pts: 4.4  },
  ],
  premium_trad: [
    { feature: "school_dist_m",   label: "Top school cluster proximity",   shap_value:  0.162, direction: "positive", feature_value: 420,   pts: 16.2 },
    { feature: "green_cover_pct", label: "Green cover & parks",            shap_value:  0.118, direction: "positive", feature_value: 28,    pts: 11.8 },
    { feature: "metro_dist_m",    label: "Metro connectivity",             shap_value:  0.094, direction: "positive", feature_value: 1200,  pts: 9.4  },
    { feature: "flood_risk",      label: "Low flood risk zone",            shap_value:  0.058, direction: "positive", feature_value: 0,     pts: 5.8  },
    { feature: "price_level",     label: "Mature price limits upside",     shap_value: -0.112, direction: "negative", feature_value: 13000, pts: 11.2 },
  ],
  tech_est: [
    { feature: "it_park_dist_m",  label: "Major IT park proximity",        shap_value:  0.188, direction: "positive", feature_value: 700,   pts: 18.8 },
    { feature: "epfo_growth_pct", label: "EPFO payroll growth (tech)",     shap_value:  0.148, direction: "positive", feature_value: 44.8,  pts: 14.8 },
    { feature: "metro_dist_m",    label: "Metro / upcoming station",       shap_value:  0.104, direction: "positive", feature_value: 1400,  pts: 10.4 },
    { feature: "dmart_flag",      label: "Hypermarket presence",           shap_value:  0.048, direction: "positive", feature_value: 1,     pts: 4.8  },
    { feature: "congestion_idx",  label: "Office-hour congestion",         shap_value: -0.078, direction: "negative", feature_value: 8.1,   pts: 7.8  },
  ],
  south_it: [
    { feature: "it_park_dist_m",  label: "IT/BPO park proximity",         shap_value:  0.172, direction: "positive", feature_value: 600,   pts: 17.2 },
    { feature: "epfo_growth_pct", label: "EPFO payroll growth",            shap_value:  0.131, direction: "positive", feature_value: 38.4,  pts: 13.1 },
    { feature: "metro_dist_m",    label: "Green Line metro proximity",     shap_value:  0.088, direction: "positive", feature_value: 1800,  pts: 8.8  },
    { feature: "flood_risk",      label: "Moderate flood risk",            shap_value: -0.074, direction: "negative", feature_value: 1,     pts: 7.4  },
    { feature: "supply_pipeline", label: "New apartment supply",           shap_value: -0.048, direction: "negative", feature_value: 3200,  pts: 4.8  },
  ],
  airport_north: [
    { feature: "airport_dist_km", label: "KIAL airport proximity",         shap_value:  0.192, direction: "positive", feature_value: 18,    pts: 19.2 },
    { feature: "redbus_growth",   label: "Bus frequency growth YoY",       shap_value:  0.148, direction: "positive", feature_value: 2.4,   pts: 14.8 },
    { feature: "new_road_flag",   label: "PRR / STRR road alignment",      shap_value:  0.118, direction: "positive", feature_value: 1,     pts: 11.8 },
    { feature: "land_supply_ha",  label: "Undeveloped plot availability",  shap_value:  0.082, direction: "positive", feature_value: 1900,  pts: 8.2  },
    { feature: "school_dist_m",   label: "School infra still developing",  shap_value: -0.054, direction: "negative", feature_value: 3400,  pts: 5.4  },
  ],
  west_mid: [
    { feature: "metro_dist_m",    label: "Green/Purple Line metro access", shap_value:  0.164, direction: "positive", feature_value: 900,   pts: 16.4 },
    { feature: "mysore_rd_access",label: "Mysore Road / NICE Road link",   shap_value:  0.128, direction: "positive", feature_value: 1,     pts: 12.8 },
    { feature: "redbus_growth",   label: "Bus route frequency surge",      shap_value:  0.094, direction: "positive", feature_value: 1.9,   pts: 9.4  },
    { feature: "land_supply_ha",  label: "Large plot supply",              shap_value:  0.072, direction: "positive", feature_value: 1400,  pts: 7.2  },
    { feature: "hospital_dist_m", label: "Healthcare gap (developing)",    shap_value: -0.058, direction: "negative", feature_value: 3800,  pts: 5.8  },
  ],
  east_emrg: [
    { feature: "it_park_dist_m",  label: "IT corridor spill-over",         shap_value:  0.178, direction: "positive", feature_value: 4200,  pts: 17.8 },
    { feature: "orr_dist_km",     label: "ORR / PRR extension planned",    shap_value:  0.144, direction: "positive", feature_value: 3.2,   pts: 14.4 },
    { feature: "redbus_growth",   label: "Bus frequency surge",            shap_value:  0.118, direction: "positive", feature_value: 2.2,   pts: 11.8 },
    { feature: "price_level",     label: "Low base price advantage",       shap_value:  0.088, direction: "positive", feature_value: 4000,  pts: 8.8  },
    { feature: "school_dist_m",   label: "School infra gap",               shap_value: -0.062, direction: "negative", feature_value: 4100,  pts: 6.2  },
  ],
  south_emrg: [
    { feature: "industrial_dist", label: "KIADB industrial area nearby",   shap_value:  0.168, direction: "positive", feature_value: 3.8,   pts: 16.8 },
    { feature: "redbus_growth",   label: "Bus route frequency growth",     shap_value:  0.134, direction: "positive", feature_value: 2.0,   pts: 13.4 },
    { feature: "ksr_dist_km",     label: "Electronic City corridor link",  shap_value:  0.104, direction: "positive", feature_value: 8.4,   pts: 10.4 },
    { feature: "price_level",     label: "Low base price advantage",       shap_value:  0.084, direction: "positive", feature_value: 3400,  pts: 8.4  },
    { feature: "flood_risk",      label: "Low-lying terrain flood risk",   shap_value: -0.072, direction: "negative", feature_value: 1,     pts: 7.2  },
  ],
  frontier_north: [
    { feature: "airport_dist_km", label: "KIAL / aerocity proximity",      shap_value:  0.234, direction: "positive", feature_value: 10,    pts: 23.4 },
    { feature: "viirs_light",     label: "Nighttime light growth CAGR",    shap_value:  0.178, direction: "positive", feature_value: 4.2,   pts: 17.8 },
    { feature: "redbus_growth",   label: "Bus routes surge (airport link)", shap_value:  0.148, direction: "positive", feature_value: 3.0,   pts: 14.8 },
    { feature: "land_supply_ha",  label: "Large agricultural land pool",   shap_value:  0.112, direction: "positive", feature_value: 5800,  pts: 11.2 },
    { feature: "infra_risk",      label: "Infrastructure execution risk",  shap_value: -0.098, direction: "negative", feature_value: 1,     pts: 9.8  },
  ],
  frontier_west: [
    { feature: "nimz_highway",    label: "NH4 / Tumkur Road corridor",     shap_value:  0.214, direction: "positive", feature_value: 1,     pts: 21.4 },
    { feature: "viirs_light",     label: "Industrial nighttime light",     shap_value:  0.168, direction: "positive", feature_value: 4.8,   pts: 16.8 },
    { feature: "redbus_growth",   label: "Bus route frequency growth",     shap_value:  0.128, direction: "positive", feature_value: 2.6,   pts: 12.8 },
    { feature: "land_supply_ha",  label: "Vast undeveloped land pool",     shap_value:  0.104, direction: "positive", feature_value: 7200,  pts: 10.4 },
    { feature: "infra_risk",      label: "Master plan execution risk",     shap_value: -0.108, direction: "negative", feature_value: 1,     pts: 10.8 },
  ],
  frontier: [
    { feature: "viirs_light",     label: "Nighttime light CAGR",           shap_value:  0.182, direction: "positive", feature_value: 3.8,   pts: 18.2 },
    { feature: "redbus_growth",   label: "Bus frequency growth",           shap_value:  0.148, direction: "positive", feature_value: 2.4,   pts: 14.8 },
    { feature: "new_road_flag",   label: "Upcoming ring road access",      shap_value:  0.124, direction: "positive", feature_value: 1,     pts: 12.4 },
    { feature: "land_supply_ha",  label: "Undeveloped plot supply",        shap_value:  0.091, direction: "positive", feature_value: 4200,  pts: 9.1  },
    { feature: "infra_risk",      label: "Infra delay execution risk",     shap_value: -0.082, direction: "negative", feature_value: 1,     pts: 8.2  },
  ],
};

// Specific overrides for zones with unique characteristics
const SIGNALS: Record<string, unknown[]> = {
  "8a3d3a119ffffff": [ // Koramangala
    { feature: "retail_density",  label: "Premium retail & F&B density",   shap_value:  0.142, direction: "positive", feature_value: 94,    pts: 14.2 },
    { feature: "it_park_dist_m",  label: "Embassy GolfLinks 1.8km",        shap_value:  0.118, direction: "positive", feature_value: 1800,  pts: 11.8 },
    { feature: "price_level",     label: "High base price drag on ROI",    shap_value: -0.134, direction: "negative", feature_value: 15200, pts: 13.4 },
    { feature: "flood_risk",      label: "HSR lake drainage risk",          shap_value: -0.071, direction: "negative", feature_value: 2,     pts: 7.1  },
    { feature: "supply_pipeline", label: "Luxury supply oversaturation",   shap_value: -0.053, direction: "negative", feature_value: 4800,  pts: 5.3  },
  ],
  "8a3d3a2a9ffffff": [ // Indiranagar
    { feature: "retail_density",  label: "100 Feet Road premium strip",    shap_value:  0.138, direction: "positive", feature_value: 98,    pts: 13.8 },
    { feature: "metro_dist_m",    label: "Indiranagar Purple Line station", shap_value:  0.124, direction: "positive", feature_value: 320,   pts: 12.4 },
    { feature: "price_level",     label: "High base price drag on ROI",    shap_value: -0.148, direction: "negative", feature_value: 16100, pts: 14.8 },
    { feature: "supply_pipeline", label: "Premium supply pipeline heavy",  shap_value: -0.062, direction: "negative", feature_value: 5200,  pts: 6.2  },
    { feature: "congestion_idx",  label: "Old Airport Road congestion",    shap_value: -0.041, direction: "negative", feature_value: 9.2,   pts: 4.1  },
  ],
  "8a3d3a2c9ffffff": [ // Whitefield
    { feature: "it_park_dist_m",  label: "ITPB / Prestige Tech Park 400m",shap_value:  0.201, direction: "positive", feature_value: 400,   pts: 20.1 },
    { feature: "epfo_growth_pct", label: "EPFO payroll growth NIC-62",     shap_value:  0.134, direction: "positive", feature_value: 44.1,  pts: 13.4 },
    { feature: "metro_dist_m",    label: "Purple Line Ph2 Whitefield stn", shap_value:  0.112, direction: "positive", feature_value: 800,   pts: 11.2 },
    { feature: "congestion_idx",  label: "Whitefield–EPIP congestion",     shap_value: -0.088, direction: "negative", feature_value: 9.1,   pts: 8.8  },
    { feature: "flood_risk",      label: "Varthur lake flooding risk",      shap_value: -0.064, direction: "negative", feature_value: 2,     pts: 6.4  },
  ],
  "8a3d3a2d9ffffff": [ // Sarjapur Road
    { feature: "it_park_dist_m",  label: "RMZ Ecoworld / Ecospace 600m",  shap_value:  0.178, direction: "positive", feature_value: 600,   pts: 17.8 },
    { feature: "epfo_growth_pct", label: "EPFO payroll growth 48.2%",     shap_value:  0.142, direction: "positive", feature_value: 48.2,  pts: 14.2 },
    { feature: "metro_dist_m",    label: "ORR metro extension planned",    shap_value:  0.094, direction: "positive", feature_value: 2100,  pts: 9.4  },
    { feature: "dmart_flag",      label: "D-Mart / Total Mall nearby",     shap_value:  0.051, direction: "positive", feature_value: 1,     pts: 5.1  },
    { feature: "flood_risk",      label: "Bellandur lake flood risk",       shap_value: -0.068, direction: "negative", feature_value: 2,     pts: 6.8  },
  ],
  "8a3d3a301ffffff": [ // Hebbal
    { feature: "metro_dist_m",    label: "Green Line Hebbal station 600m", shap_value:  0.168, direction: "positive", feature_value: 600,   pts: 16.8 },
    { feature: "airport_dist_km", label: "KIAL via Bellary Road 28km",     shap_value:  0.141, direction: "positive", feature_value: 28,    pts: 14.1 },
    { feature: "epfo_growth_pct", label: "North Bangalore EPFO growth",    shap_value:  0.118, direction: "positive", feature_value: 41.3,  pts: 11.8 },
    { feature: "lake_premium",    label: "Hebbal lake view premium",       shap_value:  0.072, direction: "positive", feature_value: 1,     pts: 7.2  },
    { feature: "congestion_idx",  label: "Bellary Road office congestion", shap_value: -0.054, direction: "negative", feature_value: 7.8,   pts: 5.4  },
  ],
  "8a3d3a311ffffff": [ // Yelahanka
    { feature: "airport_dist_km", label: "KIAL 14km via Yelahanka link",   shap_value:  0.189, direction: "positive", feature_value: 14,    pts: 18.9 },
    { feature: "redbus_growth",   label: "Airport bus routes +2.4x YoY",  shap_value:  0.151, direction: "positive", feature_value: 2.4,   pts: 15.1 },
    { feature: "new_road_flag",   label: "Peripheral Ring Road alignment", shap_value:  0.128, direction: "positive", feature_value: 1,     pts: 12.8 },
    { feature: "land_supply_ha",  label: "Large residential plots available",shap_value: 0.081, direction: "positive", feature_value: 1840, pts: 8.1  },
    { feature: "school_dist_m",   label: "School cluster (Yelahanka New)", shap_value:  0.044, direction: "positive", feature_value: 800,   pts: 4.4  },
  ],
  "8a3d3a3a1ffffff": [ // Devanahalli Aerospace Valley
    { feature: "airport_dist_km", label: "KIAL Aerocity zone 4km",         shap_value:  0.268, direction: "positive", feature_value: 4,     pts: 26.8 },
    { feature: "aerospace_sez",   label: "Aerospace Park Phase 2 SEZ",     shap_value:  0.214, direction: "positive", feature_value: 1,     pts: 21.4 },
    { feature: "epfo_growth_pct", label: "MRO / aviation payroll surge",   shap_value:  0.171, direction: "positive", feature_value: 68.4,  pts: 17.1 },
    { feature: "viirs_light",     label: "Nighttime light 5yr CAGR 4.8x", shap_value:  0.138, direction: "positive", feature_value: 4.8,   pts: 13.8 },
    { feature: "infra_risk",      label: "Single-corridor dependency",     shap_value: -0.078, direction: "negative", feature_value: 1,     pts: 7.8  },
  ],
  "8a3d3a3b1ffffff": [ // Bagalur
    { feature: "airport_dist_km", label: "KIAL 8km direct link road",      shap_value:  0.241, direction: "positive", feature_value: 8,     pts: 24.1 },
    { feature: "viirs_light",     label: "Nighttime light growth 3.4x 3yr",shap_value:  0.182, direction: "positive", feature_value: 3.4,   pts: 18.2 },
    { feature: "redbus_growth",   label: "Airport bus routes +3.2x YoY",  shap_value:  0.158, direction: "positive", feature_value: 3.2,   pts: 15.8 },
    { feature: "land_supply_ha",  label: "Agricultural land conversion",   shap_value:  0.121, direction: "positive", feature_value: 6800,  pts: 12.1 },
    { feature: "infra_risk",      label: "Road infra delay execution risk", shap_value: -0.092, direction: "negative", feature_value: 1,     pts: 9.2  },
  ],
  "8a3d3a041ffffff": [ // Dabaspet NIMZ
    { feature: "nimz_flag",       label: "National Investment Mfg Zone",   shap_value:  0.298, direction: "positive", feature_value: 1,     pts: 29.8 },
    { feature: "nh4_access",      label: "NH4 Tumkur Road frontage",       shap_value:  0.221, direction: "positive", feature_value: 1,     pts: 22.1 },
    { feature: "viirs_light",     label: "Industrial light CAGR 5.1x",     shap_value:  0.162, direction: "positive", feature_value: 5.1,   pts: 16.2 },
    { feature: "redbus_growth",   label: "Industrial bus route surge",     shap_value:  0.118, direction: "positive", feature_value: 2.9,   pts: 11.8 },
    { feature: "infra_risk",      label: "NIMZ Phase 2 timeline risk",     shap_value: -0.114, direction: "negative", feature_value: 1,     pts: 11.4 },
  ],
  "8a3d3a051ffffff": [ // Bidadi Smart City
    { feature: "smart_city_flag", label: "BMRDA Bidadi Smart City plan",   shap_value:  0.274, direction: "positive", feature_value: 1,     pts: 27.4 },
    { feature: "mysore_rd_access",label: "Mysore Road / NICE Road 2km",    shap_value:  0.198, direction: "positive", feature_value: 1,     pts: 19.8 },
    { feature: "viirs_light",     label: "Industrial light CAGR 4.2x",     shap_value:  0.144, direction: "positive", feature_value: 4.2,   pts: 14.4 },
    { feature: "redbus_growth",   label: "Mysore corridor bus surge",      shap_value:  0.108, direction: "positive", feature_value: 2.6,   pts: 10.8 },
    { feature: "infra_risk",      label: "Smart city master plan risk",    shap_value: -0.098, direction: "negative", feature_value: 1,     pts: 9.8  },
  ],
};
