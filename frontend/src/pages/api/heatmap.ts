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
    // Return empty heatmap if backend unavailable
    return new Response(
      JSON.stringify({ horizon, as_of: asOf, cells: MOCK_CELLS, total_zones: MOCK_CELLS.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};

// Mock data so the UI loads even without a backend
const MOCK_CELLS = [
  { zone_h3: "8a3d3a2d9ffffff", zone_name: "Sarjapur Road", lat: 12.9121, lng: 77.6880, investment_score: 82, predicted_roi_pct: 34.2, current_price_sqft: 9800 },
  { zone_h3: "8a3d3a2c9ffffff", zone_name: "Whitefield", lat: 12.9698, lng: 77.7480, investment_score: 76, predicted_roi_pct: 28.5, current_price_sqft: 9200 },
  { zone_h3: "8a3d3a119ffffff", zone_name: "Koramangala", lat: 12.9352, lng: 77.6270, investment_score: 71, predicted_roi_pct: 22.1, current_price_sqft: 12400 },
  { zone_h3: "8a3d3a127ffffff", zone_name: "HSR Layout", lat: 12.9116, lng: 77.6442, investment_score: 74, predicted_roi_pct: 25.8, current_price_sqft: 11200 },
  { zone_h3: "8a3d3a2a9ffffff", zone_name: "Indiranagar", lat: 12.9784, lng: 77.6408, investment_score: 68, predicted_roi_pct: 19.4, current_price_sqft: 13100 },
  { zone_h3: "8a3d3a3a1ffffff", zone_name: "Devanahalli", lat: 13.2474, lng: 77.7121, investment_score: 88, predicted_roi_pct: 52.3, current_price_sqft: 8100 },
  { zone_h3: "8a3d3a301ffffff", zone_name: "Hebbal", lat: 13.0350, lng: 77.5944, investment_score: 79, predicted_roi_pct: 31.0, current_price_sqft: 9600 },
  { zone_h3: "8a3d3a117ffffff", zone_name: "Electronic City", lat: 12.8450, lng: 77.6691, investment_score: 65, predicted_roi_pct: 17.8, current_price_sqft: 7400 },
  { zone_h3: "8a3d3a109ffffff", zone_name: "Bannerghatta Road", lat: 12.8780, lng: 77.6021, investment_score: 61, predicted_roi_pct: 15.2, current_price_sqft: 7900 },
  { zone_h3: "8a3d3a28dffffff", zone_name: "Marathahalli", lat: 12.9562, lng: 77.7019, investment_score: 72, predicted_roi_pct: 23.9, current_price_sqft: 8800 },
];
