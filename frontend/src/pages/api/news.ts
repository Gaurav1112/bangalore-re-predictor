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
    return new Response(JSON.stringify({ zone_h3: zoneH3, zone_name: null, items: MOCK_NEWS, total: MOCK_NEWS.length }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

const MOCK_NEWS = [
  { headline: "Namma Metro Phase 2 extension approved for Sarjapur corridor", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.8, days_ago: 3 },
  { headline: "Bangalore sees record 21.7M sqft office absorption in 2024", url: "#", published_at: null, signal_type: "employment", sentiment: 0.7, days_ago: 8 },
  { headline: "BBMP approves new ward expansion in North Bangalore", url: "#", published_at: null, signal_type: "policy", sentiment: 0.5, days_ago: 12 },
  { headline: "Devanahalli Aerospace Park Phase 2 land acquisition begins", url: "#", published_at: null, signal_type: "infrastructure", sentiment: 0.9, days_ago: 15 },
  { headline: "Property registrations in Bangalore hit 5-year high in Q1 2025", url: "#", published_at: null, signal_type: "market", sentiment: 0.6, days_ago: 22 },
];
