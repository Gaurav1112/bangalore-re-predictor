/**
 * Typed API client — all requests route through Astro SSR endpoints,
 * which proxy to FastAPI on Railway. Browser never calls Railway directly.
 */

// Always call Astro SSR proxy endpoints — they handle routing to FastAPI or mock data
const BASE = "/api";

export interface ZoneCell {
  zone_h3: string;
  zone_name: string | null;
  lat: number;
  lng: number;
  investment_score: number;
  predicted_roi_pct: number;
  current_price_sqft: number;
}

export interface HeatmapResponse {
  horizon: string;
  as_of: string;
  cells: ZoneCell[];
  total_zones: number;
}

export interface HorizonPrediction {
  roi_pct: number;
  price_point: number;
  price_lower: number;
  price_upper: number;
}

export interface PredictionResponse {
  zone_h3: string;
  zone_name: string | null;
  current_price_sqft: number;
  investment_score: number;
  predictions: Record<string, HorizonPrediction>;
  model_version: string;
  stale: boolean;
}

export interface ShapSignal {
  feature: string;
  label: string;
  shap_value: number;
  direction: "positive" | "negative";
  feature_value: number | null;
  pts: number;
}

export interface ExplainResponse {
  zone_h3: string;
  zone_name: string | null;
  top_signals: ShapSignal[];
}

export interface NewsItem {
  headline: string;
  url: string;
  published_at: string | null;
  signal_type: string;
  sentiment: number;
  days_ago: number | null;
}

export interface NewsResponse {
  zone_h3: string;
  zone_name: string | null;
  items: NewsItem[];
  total: number;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  heatmap: (horizon = "3yr", asOf?: string): Promise<HeatmapResponse> => {
    const q = asOf ? `?horizon=${horizon}&as_of=${asOf}` : `?horizon=${horizon}`;
    return get<HeatmapResponse>(`/heatmap${q}`);
  },

  predict: (zoneH3: string, asOf?: string): Promise<PredictionResponse> => {
    const q = `?zone_h3=${zoneH3}${asOf ? `&as_of=${asOf}` : ""}`;
    return get<PredictionResponse>(`/predict${q}`);
  },

  explain: (zoneH3: string, topN = 5): Promise<ExplainResponse> =>
    get<ExplainResponse>(`/explain?zone_h3=${zoneH3}&top_n=${topN}`),

  news: (zoneH3: string, days = 30): Promise<NewsResponse> =>
    get<NewsResponse>(`/news?zone_h3=${zoneH3}&days=${days}`),

  backtest: () => get<unknown>("/backtest"),
};
