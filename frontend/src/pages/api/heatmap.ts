import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async ({ url }) => {
  const horizon = url.searchParams.get("horizon") ?? "3yr";
  const asOf = url.searchParams.get("as_of") ?? "";
  const qs = asOf ? `?horizon=${horizon}&as_of=${asOf}` : `?horizon=${horizon}`;

  try {
    const res = await fetch(`${ML_API}/heatmap${qs}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    const cells = MOCK_CELLS.map((c) => ({
      ...c,
      predicted_roi_pct: c.roi[horizon as keyof typeof c.roi] ?? c.roi["3yr"],
    })).map(({ roi, ...rest }) => rest);

    return new Response(
      JSON.stringify({ horizon, as_of: asOf, cells, total_zones: cells.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};

// 35 zones: premium → established → developing → emerging → frontier
// Frontier/emerging zones are deliberately spread to peripheral Bangalore
// where population inflow and infra spend are leading price appreciation
const MOCK_CELLS = [
  // ── PREMIUM (high price, moderate ROI) ───────────────────────────────
  { zone_h3: "8a3d3a119ffffff", zone_name: "Koramangala",        lat: 12.9352, lng: 77.6245, investment_score: 66, current_price_sqft: 15200, roi: { "1yr": 9.1,  "3yr": 19.4, "5yr": 34.2, "10yr": 72.1 } },
  { zone_h3: "8a3d3a2a9ffffff", zone_name: "Indiranagar",        lat: 12.9784, lng: 77.6408, investment_score: 63, current_price_sqft: 16100, roi: { "1yr": 7.8,  "3yr": 17.2, "5yr": 31.0, "10yr": 65.4 } },
  { zone_h3: "8a3d3a141ffffff", zone_name: "JP Nagar",           lat: 12.9002, lng: 77.5848, investment_score: 67, current_price_sqft: 13200, roi: { "1yr": 9.8,  "3yr": 20.1, "5yr": 36.5, "10yr": 76.3 } },
  // ── ESTABLISHED ──────────────────────────────────────────────────────
  { zone_h3: "8a3d3a127ffffff", zone_name: "HSR Layout",         lat: 12.9116, lng: 77.6442, investment_score: 73, current_price_sqft: 11400, roi: { "1yr": 11.2, "3yr": 24.3, "5yr": 44.1, "10yr": 96.2 } },
  { zone_h3: "8a3d3a2d9ffffff", zone_name: "Sarjapur Road",      lat: 12.9121, lng: 77.6880, investment_score: 79, current_price_sqft:  9800, roi: { "1yr": 15.4, "3yr": 33.2, "5yr": 58.1, "10yr": 121.4 } },
  { zone_h3: "8a3d3a2c9ffffff", zone_name: "Whitefield",         lat: 12.9698, lng: 77.7480, investment_score: 77, current_price_sqft:  9400, roi: { "1yr": 13.1, "3yr": 29.0, "5yr": 52.3, "10yr": 108.7 } },
  { zone_h3: "8a3d3a28dffffff", zone_name: "Marathahalli",       lat: 12.9562, lng: 77.7019, investment_score: 73, current_price_sqft:  8900, roi: { "1yr": 11.4, "3yr": 25.1, "5yr": 46.0, "10yr": 98.4 } },
  { zone_h3: "8a3d3a117ffffff", zone_name: "Electronic City",    lat: 12.8450, lng: 77.6691, investment_score: 64, current_price_sqft:  7600, roi: { "1yr":  8.7, "3yr": 18.3, "5yr": 33.8, "10yr": 72.9 } },
  { zone_h3: "8a3d3a109ffffff", zone_name: "Bannerghatta Road",  lat: 12.8780, lng: 77.6021, investment_score: 62, current_price_sqft:  8100, roi: { "1yr":  7.9, "3yr": 16.4, "5yr": 30.2, "10yr": 64.1 } },
  { zone_h3: "8a3d3a145ffffff", zone_name: "Banashankari",       lat: 12.9264, lng: 77.5490, investment_score: 69, current_price_sqft:  8600, roi: { "1yr": 10.2, "3yr": 21.8, "5yr": 39.4, "10yr": 83.7 } },
  // ── DEVELOPING (mid-tier, infra catalysts in play) ───────────────────
  { zone_h3: "8a3d3a301ffffff", zone_name: "Hebbal",             lat: 13.0350, lng: 77.5944, investment_score: 79, current_price_sqft:  9700, roi: { "1yr": 14.8, "3yr": 32.1, "5yr": 57.4, "10yr": 118.3 } },
  { zone_h3: "8a3d3a311ffffff", zone_name: "Yelahanka",          lat: 13.1007, lng: 77.5963, investment_score: 81, current_price_sqft:  7300, roi: { "1yr": 16.9, "3yr": 36.2, "5yr": 64.1, "10yr": 133.0 } },
  { zone_h3: "8a3d3a315ffffff", zone_name: "Thanisandra",        lat: 13.0571, lng: 77.6207, investment_score: 80, current_price_sqft:  7600, roi: { "1yr": 16.4, "3yr": 35.0, "5yr": 62.4, "10yr": 128.9 } },
  { zone_h3: "8a3d3a24dffffff", zone_name: "KR Puram",           lat: 13.0024, lng: 77.6971, investment_score: 76, current_price_sqft:  7100, roi: { "1yr": 13.2, "3yr": 29.1, "5yr": 52.8, "10yr": 109.4 } },
  { zone_h3: "8a3d3a14dffffff", zone_name: "Kanakapura Road",    lat: 12.8570, lng: 77.5712, investment_score: 74, current_price_sqft:  6900, roi: { "1yr": 12.8, "3yr": 27.9, "5yr": 50.4, "10yr": 104.8 } },
  // ── EMERGING (lower base price, high ROI potential) ──────────────────
  { zone_h3: "8a3d3a319ffffff", zone_name: "Kogilu",             lat: 13.0753, lng: 77.6062, investment_score: 82, current_price_sqft:  5400, roi: { "1yr": 18.7, "3yr": 41.2, "5yr": 72.4, "10yr": 148.1 } },
  { zone_h3: "8a3d3a31dffffff", zone_name: "Rajanukunte",        lat: 13.0942, lng: 77.5744, investment_score: 83, current_price_sqft:  4600, roi: { "1yr": 20.4, "3yr": 45.1, "5yr": 78.3, "10yr": 161.2 } },
  { zone_h3: "8a3d3a2bdffffff", zone_name: "Dommasandra",        lat: 12.8918, lng: 77.7456, investment_score: 78, current_price_sqft:  4900, roi: { "1yr": 17.1, "3yr": 37.4, "5yr": 66.2, "10yr": 137.0 } },
  { zone_h3: "8a3d3a2a1ffffff", zone_name: "Virgonagar",         lat: 13.0128, lng: 77.7601, investment_score: 80, current_price_sqft:  3900, roi: { "1yr": 19.8, "3yr": 43.2, "5yr": 75.1, "10yr": 154.8 } },
  { zone_h3: "8a3d3a12dffffff", zone_name: "Chandapura",         lat: 12.8075, lng: 77.6949, investment_score: 73, current_price_sqft:  3500, roi: { "1yr": 15.1, "3yr": 33.4, "5yr": 60.1, "10yr": 123.2 } },
  { zone_h3: "8a3d3a0d1ffffff", zone_name: "Kengeri Extension",  lat: 12.9049, lng: 77.4887, investment_score: 72, current_price_sqft:  4400, roi: { "1yr": 14.2, "3yr": 30.8, "5yr": 54.4, "10yr": 112.1 } },
  { zone_h3: "8a3d3a121ffffff", zone_name: "Jigani Phase 3",     lat: 12.7872, lng: 77.6296, investment_score: 76, current_price_sqft:  3700, roi: { "1yr": 17.2, "3yr": 37.1, "5yr": 66.0, "10yr": 136.9 } },
  { zone_h3: "8a3d3a2baffffff", zone_name: "Attibele",           lat: 12.7700, lng: 77.7900, investment_score: 77, current_price_sqft:  3000, roi: { "1yr": 19.4, "3yr": 42.1, "5yr": 73.4, "10yr": 151.7 } },
  // ── FRONTIER (early-stage, catalysts: airport, NIMZ, Ring Road) ──────
  { zone_h3: "8a3d3a3b1ffffff", zone_name: "Bagalur",            lat: 13.1678, lng: 77.6800, investment_score: 88, current_price_sqft:  4300, roi: { "1yr": 25.1, "3yr": 58.4, "5yr": 98.2, "10yr": 197.3 } },
  { zone_h3: "8a3d3a2ddffffff", zone_name: "Budigere Cross",     lat: 13.0784, lng: 77.7889, investment_score: 85, current_price_sqft:  4000, roi: { "1yr": 23.4, "3yr": 52.1, "5yr": 89.4, "10yr": 181.8 } },
  { zone_h3: "8a3d3a2e1ffffff", zone_name: "Hoskote",            lat: 13.0699, lng: 77.7980, investment_score: 81, current_price_sqft:  3200, roi: { "1yr": 21.2, "3yr": 47.3, "5yr": 82.1, "10yr": 169.2 } },
  { zone_h3: "8a3d3a3a1ffffff", zone_name: "Devanahalli Aerospace", lat: 13.2474, lng: 77.7121, investment_score: 91, current_price_sqft: 8400, roi: { "1yr": 27.8, "3yr": 61.2, "5yr": 104.1, "10yr": 211.4 } },
  { zone_h3: "8a3d3a069ffffff", zone_name: "Nelamangala",        lat: 13.0989, lng: 77.3919, investment_score: 80, current_price_sqft:  2900, roi: { "1yr": 23.1, "3yr": 51.4, "5yr": 87.2, "10yr": 178.1 } },
  { zone_h3: "8a3d3a059ffffff", zone_name: "Hesaraghatta",       lat: 13.1164, lng: 77.4826, investment_score: 78, current_price_sqft:  2200, roi: { "1yr": 21.4, "3yr": 47.2, "5yr": 81.3, "10yr": 167.4 } },
  { zone_h3: "8a3d3a351ffffff", zone_name: "Doddaballapur Road", lat: 13.1900, lng: 77.5400, investment_score: 84, current_price_sqft:  2700, roi: { "1yr": 26.4, "3yr": 59.1, "5yr": 100.4, "10yr": 204.2 } },
  { zone_h3: "8a3d3a051ffffff", zone_name: "Bidadi Smart City",  lat: 12.8097, lng: 77.3902, investment_score: 86, current_price_sqft:  2300, roi: { "1yr": 28.1, "3yr": 63.4, "5yr": 107.8, "10yr": 219.7 } },
  { zone_h3: "8a3d3a041ffffff", zone_name: "Dabaspet NIMZ",      lat: 13.2139, lng: 77.3619, investment_score: 88, current_price_sqft:  1900, roi: { "1yr": 31.4, "3yr": 71.2, "5yr": 118.4, "10yr": 238.1 } },
  { zone_h3: "8a3d3a3e1ffffff", zone_name: "Nandi Hills Corridor", lat: 13.3700, lng: 77.6800, investment_score: 82, current_price_sqft: 1700, roi: { "1yr": 29.2, "3yr": 65.1, "5yr": 110.4, "10yr": 224.8 } },
  { zone_h3: "8a3d3a3d1ffffff", zone_name: "Sompura Gate (KIADB)", lat: 13.2300, lng: 77.6500, investment_score: 85, current_price_sqft: 2500, roi: { "1yr": 27.1, "3yr": 60.4, "5yr": 102.1, "10yr": 208.3 } },
  // Tumkur Road / Peenya — industrial corridor with Metro Blue Line station
  { zone_h3: "8a3d3a35dffffff", zone_name: "Peenya–Tumkur Corridor", lat: 13.0284, lng: 77.5192, investment_score: 74, current_price_sqft: 5200, roi: { "1yr": 13.4, "3yr": 29.8, "5yr": 53.1, "10yr": 110.4 } },
];
