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

// Signals vary by zone category so the panel tells a coherent story per area
function mockExplain(zoneH3: string) {
  const signals = ZONE_SIGNALS[zoneH3] ?? ZONE_SIGNALS["__frontier__"];
  return { zone_h3: zoneH3, zone_name: null, top_signals: signals };
}

const ZONE_SIGNALS: Record<string, unknown[]> = {
  // ── Premium zones: amenity-driven, limited upside ─────────────────────
  "8a3d3a119ffffff": [ // Koramangala
    { feature: "retail_density", label: "Premium retail density",    shap_value: 0.142, direction: "positive", feature_value: 94, pts: 14.2 },
    { feature: "it_park_dist_m", label: "IT park proximity",        shap_value: 0.118, direction: "positive", feature_value: 1200, pts: 11.8 },
    { feature: "price_level",    label: "High base price drag",      shap_value: -0.134, direction: "negative", feature_value: 15200, pts: 13.4 },
    { feature: "flood_risk",     label: "Low-lying flood risk",      shap_value: -0.071, direction: "negative", feature_value: 2, pts: 7.1 },
    { feature: "supply_pipeline",label: "Oversupply in pipeline",    shap_value: -0.053, direction: "negative", feature_value: 4800, pts: 5.3 },
  ],
  "8a3d3a2a9ffffff": [ // Indiranagar
    { feature: "retail_density", label: "Premium retail & F&B",     shap_value: 0.138, direction: "positive", feature_value: 98, pts: 13.8 },
    { feature: "metro_dist_m",   label: "Purple Line metro access",  shap_value: 0.112, direction: "positive", feature_value: 380, pts: 11.2 },
    { feature: "price_level",    label: "High base price drag",      shap_value: -0.148, direction: "negative", feature_value: 16100, pts: 14.8 },
    { feature: "supply_pipeline",label: "Oversupply in pipeline",    shap_value: -0.062, direction: "negative", feature_value: 5200, pts: 6.2 },
    { feature: "congestion_idx", label: "Traffic congestion penalty", shap_value: -0.041, direction: "negative", feature_value: 8.4, pts: 4.1 },
  ],
  // ── Established: solid fundamentals ──────────────────────────────────
  "8a3d3a2d9ffffff": [ // Sarjapur Road
    { feature: "it_park_dist_m", label: "Major IT park proximity",   shap_value: 0.178, direction: "positive", feature_value: 800, pts: 17.8 },
    { feature: "epfo_growth_pct",label: "EPFO payroll growth",       shap_value: 0.142, direction: "positive", feature_value: 48.2, pts: 14.2 },
    { feature: "metro_dist_m",   label: "Upcoming ORR metro stop",   shap_value: 0.094, direction: "positive", feature_value: 2100, pts: 9.4 },
    { feature: "dmart_flag",     label: "D-Mart & hypermarket",      shap_value: 0.051, direction: "positive", feature_value: 1, pts: 5.1 },
    { feature: "flood_risk",     label: "Moderate low-lying risk",   shap_value: -0.068, direction: "negative", feature_value: 1, pts: 6.8 },
  ],
  "8a3d3a2c9ffffff": [ // Whitefield
    { feature: "it_park_dist_m", label: "ITPB / Prestige Tech Park", shap_value: 0.201, direction: "positive", feature_value: 400, pts: 20.1 },
    { feature: "epfo_growth_pct",label: "EPFO payroll growth",       shap_value: 0.134, direction: "positive", feature_value: 44.1, pts: 13.4 },
    { feature: "metro_dist_m",   label: "Purple Line Phase 2 stop",  shap_value: 0.112, direction: "positive", feature_value: 1200, pts: 11.2 },
    { feature: "congestion_idx", label: "Traffic congestion penalty", shap_value: -0.088, direction: "negative", feature_value: 9.1, pts: 8.8 },
    { feature: "flood_risk",     label: "Varthur lake flood risk",   shap_value: -0.064, direction: "negative", feature_value: 2, pts: 6.4 },
  ],
  // ── Developing: infra catalysts lifting value ─────────────────────────
  "8a3d3a301ffffff": [ // Hebbal
    { feature: "metro_dist_m",   label: "Green Line metro proximity", shap_value: 0.168, direction: "positive", feature_value: 600, pts: 16.8 },
    { feature: "airport_dist_km",label: "Airport expressway access",  shap_value: 0.141, direction: "positive", feature_value: 28, pts: 14.1 },
    { feature: "epfo_growth_pct",label: "EPFO payroll growth",        shap_value: 0.118, direction: "positive", feature_value: 41.3, pts: 11.8 },
    { feature: "lake_proximity", label: "Hebbal lake premium",        shap_value: 0.072, direction: "positive", feature_value: 1, pts: 7.2 },
    { feature: "congestion_idx", label: "Bellary Road congestion",    shap_value: -0.054, direction: "negative", feature_value: 7.8, pts: 5.4 },
  ],
  "8a3d3a311ffffff": [ // Yelahanka
    { feature: "airport_dist_km",label: "KIAL 14km, expressway link", shap_value: 0.189, direction: "positive", feature_value: 14, pts: 18.9 },
    { feature: "redbus_growth",  label: "Bus route frequency surge",  shap_value: 0.151, direction: "positive", feature_value: 2.4, pts: 15.1 },
    { feature: "new_road_flag",  label: "PRR / STRR alignment",       shap_value: 0.128, direction: "positive", feature_value: 1, pts: 12.8 },
    { feature: "land_supply_ha", label: "Large land parcels available", shap_value: 0.081, direction: "positive", feature_value: 1840, pts: 8.1 },
    { feature: "flood_risk",     label: "Low flood risk zone",         shap_value: 0.044, direction: "positive", feature_value: 0, pts: 4.4 },
  ],
  // ── Emerging zones: early-mover signals ──────────────────────────────
  "8a3d3a319ffffff": [ // Kogilu
    { feature: "metro_dist_m",   label: "Phase 3 Kogilu metro plan",  shap_value: 0.192, direction: "positive", feature_value: 800, pts: 19.2 },
    { feature: "redbus_growth",  label: "Bus frequency +2.1x YoY",   shap_value: 0.148, direction: "positive", feature_value: 2.1, pts: 14.8 },
    { feature: "land_supply_ha", label: "Undeveloped plot supply",    shap_value: 0.112, direction: "positive", feature_value: 2200, pts: 11.2 },
    { feature: "price_level",    label: "Low base price advantage",   shap_value: 0.094, direction: "positive", feature_value: 5400, pts: 9.4 },
    { feature: "school_dist_m",  label: "School infrastructure gap",  shap_value: -0.058, direction: "negative", feature_value: 3200, pts: 5.8 },
  ],
  "8a3d3a31dffffff": [ // Rajanukunte
    { feature: "new_road_flag",  label: "Peripheral Ring Road bypass", shap_value: 0.204, direction: "positive", feature_value: 1, pts: 20.4 },
    { feature: "redbus_growth",  label: "Bus frequency +2.8x YoY",    shap_value: 0.167, direction: "positive", feature_value: 2.8, pts: 16.7 },
    { feature: "land_supply_ha", label: "Large undeveloped plots",     shap_value: 0.138, direction: "positive", feature_value: 3100, pts: 13.8 },
    { feature: "airport_dist_km",label: "KIAL corridor access",        shap_value: 0.092, direction: "positive", feature_value: 22, pts: 9.2 },
    { feature: "hospital_dist_m",label: "Healthcare infra gap",        shap_value: -0.064, direction: "negative", feature_value: 4800, pts: 6.4 },
  ],
  // ── Frontier: pure infrastructure-led thesis ──────────────────────────
  "8a3d3a3b1ffffff": [ // Bagalur
    { feature: "airport_dist_km",label: "KIAL 8km, direct link road", shap_value: 0.241, direction: "positive", feature_value: 8, pts: 24.1 },
    { feature: "viirs_light",    label: "Nighttime light growth 3yr", shap_value: 0.182, direction: "positive", feature_value: 3.4, pts: 18.2 },
    { feature: "redbus_growth",  label: "Bus routes +3.2x (airport)", shap_value: 0.158, direction: "positive", feature_value: 3.2, pts: 15.8 },
    { feature: "land_supply_ha", label: "Vast agricultural land pool", shap_value: 0.121, direction: "positive", feature_value: 6800, pts: 12.1 },
    { feature: "infra_risk",     label: "Infra delay execution risk",  shap_value: -0.092, direction: "negative", feature_value: 1, pts: 9.2 },
  ],
  "8a3d3a3a1ffffff": [ // Devanahalli Aerospace
    { feature: "airport_dist_km",label: "KIAL 4km, aerocity zone",    shap_value: 0.268, direction: "positive", feature_value: 4, pts: 26.8 },
    { feature: "aerospace_sez",  label: "Aerospace Park Phase 2 SEZ", shap_value: 0.214, direction: "positive", feature_value: 1, pts: 21.4 },
    { feature: "epfo_growth_pct",label: "MRO/aviation EPFO growth",   shap_value: 0.171, direction: "positive", feature_value: 68.4, pts: 17.1 },
    { feature: "viirs_light",    label: "Nighttime light 5yr CAGR",   shap_value: 0.138, direction: "positive", feature_value: 4.8, pts: 13.8 },
    { feature: "infra_risk",     label: "Single-corridor dependency",  shap_value: -0.078, direction: "negative", feature_value: 1, pts: 7.8 },
  ],
  "8a3d3a041ffffff": [ // Dabaspet NIMZ
    { feature: "nimz_flag",      label: "National Investment Mfg Zone", shap_value: 0.298, direction: "positive", feature_value: 1, pts: 29.8 },
    { feature: "nh4_access",     label: "NH4 / Tumkur Road direct",   shap_value: 0.221, direction: "positive", feature_value: 1, pts: 22.1 },
    { feature: "viirs_light",    label: "Industrial nighttime light",  shap_value: 0.162, direction: "positive", feature_value: 5.1, pts: 16.2 },
    { feature: "redbus_growth",  label: "Industrial bus route surge",  shap_value: 0.118, direction: "positive", feature_value: 2.9, pts: 11.8 },
    { feature: "infra_risk",     label: "NIMZ timeline execution risk", shap_value: -0.114, direction: "negative", feature_value: 1, pts: 11.4 },
  ],
  "8a3d3a051ffffff": [ // Bidadi Smart City
    { feature: "smart_city_flag",label: "BMRDA Bidadi smart city",    shap_value: 0.274, direction: "positive", feature_value: 1, pts: 27.4 },
    { feature: "mysore_rd_access",label: "Mysore Road / NICE Road",   shap_value: 0.198, direction: "positive", feature_value: 1, pts: 19.8 },
    { feature: "viirs_light",    label: "Nighttime light 5yr CAGR",   shap_value: 0.144, direction: "positive", feature_value: 4.2, pts: 14.4 },
    { feature: "redbus_growth",  label: "Mysore bus corridor surge",  shap_value: 0.108, direction: "positive", feature_value: 2.6, pts: 10.8 },
    { feature: "infra_risk",     label: "Master plan execution risk",  shap_value: -0.098, direction: "negative", feature_value: 1, pts: 9.8 },
  ],
  // Default fallback for any unknown frontier zone
  "__frontier__": [
    { feature: "viirs_light",    label: "Nighttime light CAGR",       shap_value: 0.182, direction: "positive", feature_value: 3.8, pts: 18.2 },
    { feature: "redbus_growth",  label: "Bus frequency growth",        shap_value: 0.148, direction: "positive", feature_value: 2.4, pts: 14.8 },
    { feature: "new_road_flag",  label: "Upcoming ring road access",   shap_value: 0.124, direction: "positive", feature_value: 1, pts: 12.4 },
    { feature: "land_supply_ha", label: "Undeveloped plot supply",     shap_value: 0.091, direction: "positive", feature_value: 4200, pts: 9.1 },
    { feature: "infra_risk",     label: "Infra delay execution risk",  shap_value: -0.082, direction: "negative", feature_value: 1, pts: 8.2 },
  ],
};
