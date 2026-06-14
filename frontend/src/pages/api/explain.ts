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
    return new Response(JSON.stringify(MOCK_EXPLAIN(zoneH3)), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

const MOCK_EXPLAIN = (zoneH3: string) => ({
  zone_h3: zoneH3,
  zone_name: null,
  top_signals: [
    { feature: "metro_dist_m", label: "Metro walking distance", shap_value: 0.182, direction: "positive", feature_value: 480, pts: 18.2 },
    { feature: "epfo_growth_pct", label: "EPFO payroll growth", shap_value: 0.121, direction: "positive", feature_value: 41.2, pts: 12.1 },
    { feature: "flood_risk_score", label: "Flood risk zone", shap_value: -0.087, direction: "negative", feature_value: 1, pts: 8.7 },
    { feature: "nifty_it_12m_return_pct", label: "Nifty IT 12M return", shap_value: 0.065, direction: "positive", feature_value: 36.0, pts: 6.5 },
    { feature: "dmart_flag", label: "DMart nearby", shap_value: 0.043, direction: "positive", feature_value: 1, pts: 4.3 },
  ],
});
