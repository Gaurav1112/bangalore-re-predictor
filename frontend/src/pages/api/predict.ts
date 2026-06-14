import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async ({ params, url }) => {
  const zoneH3 = url.searchParams.get("zone_h3") ?? url.pathname.split("/").pop() ?? "";
  const asOf = url.searchParams.get("as_of") ?? "";
  const qs = asOf ? `?as_of=${asOf}` : "";

  try {
    const res = await fetch(`${ML_API}/predict/${zoneH3}${qs}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify(MOCK_PREDICTION(zoneH3)), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

const MOCK_PREDICTION = (zoneH3: string) => ({
  zone_h3: zoneH3,
  zone_name: ZONE_NAMES[zoneH3] ?? zoneH3,
  current_price_sqft: 9200,
  investment_score: 78,
  predictions: {
    "1yr":  { roi_pct: 11.2, price_point: 10231, price_lower: 9010, price_upper: 11452 },
    "3yr":  { roi_pct: 34.2, price_point: 12347, price_lower: 10586, price_upper: 14107 },
    "5yr":  { roi_pct: 61.0, price_point: 14812, price_lower: 12428, price_upper: 17196 },
    "10yr": { roi_pct: 143.0, price_point: 22356, price_lower: 18024, price_upper: 26687 },
  },
  model_version: "mock",
  stale: false,
});

const ZONE_NAMES: Record<string, string> = {
  "8a3d3a2d9ffffff": "Sarjapur Road",
  "8a3d3a2c9ffffff": "Whitefield",
  "8a3d3a119ffffff": "Koramangala",
  "8a3d3a127ffffff": "HSR Layout",
  "8a3d3a2a9ffffff": "Indiranagar",
  "8a3d3a3a1ffffff": "Devanahalli",
  "8a3d3a301ffffff": "Hebbal",
  "8a3d3a117ffffff": "Electronic City",
  "8a3d3a109ffffff": "Bannerghatta Road",
  "8a3d3a28dffffff": "Marathahalli",
};
