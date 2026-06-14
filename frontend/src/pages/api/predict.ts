import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async ({ url }) => {
  const zoneH3 = url.searchParams.get("zone_h3") ?? "";
  const asOf = url.searchParams.get("as_of") ?? "";
  const qs = asOf ? `?as_of=${asOf}` : "";

  try {
    const res = await fetch(`${ML_API}/predict/${zoneH3}${qs}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify(mockPrediction(zoneH3)), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

function mockPrediction(zoneH3: string) {
  const z = ZONE_DATA[zoneH3] ?? ZONE_DATA["8a3d3a2d9ffffff"];
  const p = z.price;
  return {
    zone_h3: zoneH3,
    zone_name: z.name,
    current_price_sqft: p,
    investment_score: z.score,
    predictions: {
      "1yr":  { roi_pct: z.roi["1yr"],  price_point: Math.round(p * (1 + z.roi["1yr"]  / 100)), price_lower: Math.round(p * (1 + z.roi["1yr"]  / 100) * 0.88), price_upper: Math.round(p * (1 + z.roi["1yr"]  / 100) * 1.12) },
      "3yr":  { roi_pct: z.roi["3yr"],  price_point: Math.round(p * (1 + z.roi["3yr"]  / 100)), price_lower: Math.round(p * (1 + z.roi["3yr"]  / 100) * 0.84), price_upper: Math.round(p * (1 + z.roi["3yr"]  / 100) * 1.16) },
      "5yr":  { roi_pct: z.roi["5yr"],  price_point: Math.round(p * (1 + z.roi["5yr"]  / 100)), price_lower: Math.round(p * (1 + z.roi["5yr"]  / 100) * 0.80), price_upper: Math.round(p * (1 + z.roi["5yr"]  / 100) * 1.20) },
      "10yr": { roi_pct: z.roi["10yr"], price_point: Math.round(p * (1 + z.roi["10yr"] / 100)), price_lower: Math.round(p * (1 + z.roi["10yr"] / 100) * 0.72), price_upper: Math.round(p * (1 + z.roi["10yr"] / 100) * 1.28) },
    },
    model_version: "mock-v1",
    stale: false,
  };
}

interface ZoneEntry {
  name: string;
  price: number;
  score: number;
  roi: Record<string, number>;
}

const ZONE_DATA: Record<string, ZoneEntry> = {
  // Premium
  "8a3d3a119ffffff": { name: "Koramangala",          price: 15200, score: 66, roi: { "1yr": 9.1,  "3yr": 19.4, "5yr": 34.2, "10yr": 72.1  } },
  "8a3d3a2a9ffffff": { name: "Indiranagar",          price: 16100, score: 63, roi: { "1yr": 7.8,  "3yr": 17.2, "5yr": 31.0, "10yr": 65.4  } },
  "8a3d3a141ffffff": { name: "JP Nagar",             price: 13200, score: 67, roi: { "1yr": 9.8,  "3yr": 20.1, "5yr": 36.5, "10yr": 76.3  } },
  // Established
  "8a3d3a127ffffff": { name: "HSR Layout",           price: 11400, score: 73, roi: { "1yr": 11.2, "3yr": 24.3, "5yr": 44.1, "10yr": 96.2  } },
  "8a3d3a2d9ffffff": { name: "Sarjapur Road",        price:  9800, score: 79, roi: { "1yr": 15.4, "3yr": 33.2, "5yr": 58.1, "10yr": 121.4 } },
  "8a3d3a2c9ffffff": { name: "Whitefield",           price:  9400, score: 77, roi: { "1yr": 13.1, "3yr": 29.0, "5yr": 52.3, "10yr": 108.7 } },
  "8a3d3a28dffffff": { name: "Marathahalli",         price:  8900, score: 73, roi: { "1yr": 11.4, "3yr": 25.1, "5yr": 46.0, "10yr": 98.4  } },
  "8a3d3a117ffffff": { name: "Electronic City",      price:  7600, score: 64, roi: { "1yr": 8.7,  "3yr": 18.3, "5yr": 33.8, "10yr": 72.9  } },
  "8a3d3a109ffffff": { name: "Bannerghatta Road",    price:  8100, score: 62, roi: { "1yr": 7.9,  "3yr": 16.4, "5yr": 30.2, "10yr": 64.1  } },
  "8a3d3a145ffffff": { name: "Banashankari",         price:  8600, score: 69, roi: { "1yr": 10.2, "3yr": 21.8, "5yr": 39.4, "10yr": 83.7  } },
  // Developing
  "8a3d3a301ffffff": { name: "Hebbal",               price:  9700, score: 79, roi: { "1yr": 14.8, "3yr": 32.1, "5yr": 57.4, "10yr": 118.3 } },
  "8a3d3a311ffffff": { name: "Yelahanka",            price:  7300, score: 81, roi: { "1yr": 16.9, "3yr": 36.2, "5yr": 64.1, "10yr": 133.0 } },
  "8a3d3a315ffffff": { name: "Thanisandra",          price:  7600, score: 80, roi: { "1yr": 16.4, "3yr": 35.0, "5yr": 62.4, "10yr": 128.9 } },
  "8a3d3a24dffffff": { name: "KR Puram",             price:  7100, score: 76, roi: { "1yr": 13.2, "3yr": 29.1, "5yr": 52.8, "10yr": 109.4 } },
  "8a3d3a14dffffff": { name: "Kanakapura Road",      price:  6900, score: 74, roi: { "1yr": 12.8, "3yr": 27.9, "5yr": 50.4, "10yr": 104.8 } },
  // Emerging
  "8a3d3a319ffffff": { name: "Kogilu",               price:  5400, score: 82, roi: { "1yr": 18.7, "3yr": 41.2, "5yr": 72.4, "10yr": 148.1 } },
  "8a3d3a31dffffff": { name: "Rajanukunte",          price:  4600, score: 83, roi: { "1yr": 20.4, "3yr": 45.1, "5yr": 78.3, "10yr": 161.2 } },
  "8a3d3a2bdffffff": { name: "Dommasandra",          price:  4900, score: 78, roi: { "1yr": 17.1, "3yr": 37.4, "5yr": 66.2, "10yr": 137.0 } },
  "8a3d3a2a1ffffff": { name: "Virgonagar",           price:  3900, score: 80, roi: { "1yr": 19.8, "3yr": 43.2, "5yr": 75.1, "10yr": 154.8 } },
  "8a3d3a12dffffff": { name: "Chandapura",           price:  3500, score: 73, roi: { "1yr": 15.1, "3yr": 33.4, "5yr": 60.1, "10yr": 123.2 } },
  "8a3d3a0d1ffffff": { name: "Kengeri Extension",    price:  4400, score: 72, roi: { "1yr": 14.2, "3yr": 30.8, "5yr": 54.4, "10yr": 112.1 } },
  "8a3d3a121ffffff": { name: "Jigani Phase 3",       price:  3700, score: 76, roi: { "1yr": 17.2, "3yr": 37.1, "5yr": 66.0, "10yr": 136.9 } },
  "8a3d3a2baffffff": { name: "Attibele",             price:  3000, score: 77, roi: { "1yr": 19.4, "3yr": 42.1, "5yr": 73.4, "10yr": 151.7 } },
  // Frontier
  "8a3d3a3b1ffffff": { name: "Bagalur",              price:  4300, score: 88, roi: { "1yr": 25.1, "3yr": 58.4, "5yr": 98.2,  "10yr": 197.3 } },
  "8a3d3a2ddffffff": { name: "Budigere Cross",       price:  4000, score: 85, roi: { "1yr": 23.4, "3yr": 52.1, "5yr": 89.4,  "10yr": 181.8 } },
  "8a3d3a2e1ffffff": { name: "Hoskote",              price:  3200, score: 81, roi: { "1yr": 21.2, "3yr": 47.3, "5yr": 82.1,  "10yr": 169.2 } },
  "8a3d3a3a1ffffff": { name: "Devanahalli Aerospace",price:  8400, score: 91, roi: { "1yr": 27.8, "3yr": 61.2, "5yr": 104.1, "10yr": 211.4 } },
  "8a3d3a069ffffff": { name: "Nelamangala",          price:  2900, score: 80, roi: { "1yr": 23.1, "3yr": 51.4, "5yr": 87.2,  "10yr": 178.1 } },
  "8a3d3a059ffffff": { name: "Hesaraghatta",         price:  2200, score: 78, roi: { "1yr": 21.4, "3yr": 47.2, "5yr": 81.3,  "10yr": 167.4 } },
  "8a3d3a351ffffff": { name: "Doddaballapur Road",   price:  2700, score: 84, roi: { "1yr": 26.4, "3yr": 59.1, "5yr": 100.4, "10yr": 204.2 } },
  "8a3d3a051ffffff": { name: "Bidadi Smart City",    price:  2300, score: 86, roi: { "1yr": 28.1, "3yr": 63.4, "5yr": 107.8, "10yr": 219.7 } },
  "8a3d3a041ffffff": { name: "Dabaspet NIMZ",        price:  1900, score: 88, roi: { "1yr": 31.4, "3yr": 71.2, "5yr": 118.4, "10yr": 238.1 } },
  "8a3d3a3e1ffffff": { name: "Nandi Hills Corridor", price:  1700, score: 82, roi: { "1yr": 29.2, "3yr": 65.1, "5yr": 110.4, "10yr": 224.8 } },
  "8a3d3a3d1ffffff": { name: "Sompura Gate (KIADB)",    price:  2500, score: 85, roi: { "1yr": 27.1, "3yr": 60.4, "5yr": 102.1, "10yr": 208.3 } },
  "8a3d3a35dffffff": { name: "Peenya–Tumkur Corridor", price:  5200, score: 74, roi: { "1yr": 13.4, "3yr": 29.8, "5yr": 53.1,  "10yr": 110.4 } },
};
