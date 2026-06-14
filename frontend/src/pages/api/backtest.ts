import type { APIRoute } from "astro";

const ML_API = import.meta.env.ML_API_URL ?? "http://localhost:8000";

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(`${ML_API}/backtest/history`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify(MOCK_BACKTEST), { headers: { "Content-Type": "application/json" } });
  }
};

const MOCK_BACKTEST = {
  overall_mape: 8.4,
  folds: [
    { fold_idx: 0, train_end: "2014-12-31", test_start: "2015-02-01", test_end: "2015-07-31", mape: 11.2, rmse: 820 },
    { fold_idx: 1, train_end: "2015-06-30", test_start: "2015-08-01", test_end: "2016-01-31", mape: 9.7, rmse: 710 },
    { fold_idx: 2, train_end: "2016-12-31", test_start: "2017-02-01", test_end: "2017-07-31", mape: 8.8, rmse: 650 },
    { fold_idx: 3, train_end: "2017-06-30", test_start: "2017-08-01", test_end: "2018-01-31", mape: 7.1, rmse: 540 },
    { fold_idx: 4, train_end: "2018-12-31", test_start: "2019-02-01", test_end: "2019-07-31", mape: 8.2, rmse: 620 },
    { fold_idx: 5, train_end: "2019-06-30", test_start: "2019-08-01", test_end: "2020-01-31", mape: 6.9, rmse: 510 },
    { fold_idx: 6, train_end: "2020-12-31", test_start: "2021-02-01", test_end: "2021-07-31", mape: 7.8, rmse: 580 },
    { fold_idx: 7, train_end: "2021-06-30", test_start: "2021-08-01", test_end: "2022-01-31", mape: 7.2, rmse: 530 },
  ],
  zone_samples: [
    { zone_h3: "s1", zone_name: "Sarjapur Road", year: 2017, predicted_price: 5200, actual_price: 5500, predicted_3yr_roi: 41.0, actual_3yr_roi: 44.0 },
    { zone_h3: "s2", zone_name: "Whitefield", year: 2015, predicted_price: 4100, actual_price: 4300, predicted_3yr_roi: 28.0, actual_3yr_roi: 31.0 },
    { zone_h3: "s3", zone_name: "Devanahalli", year: 2019, predicted_price: 3800, actual_price: 3650, predicted_3yr_roi: 52.0, actual_3yr_roi: 49.0 },
    { zone_h3: "s4", zone_name: "Electronic City", year: 2017, predicted_price: 3200, actual_price: 3400, predicted_3yr_roi: 22.0, actual_3yr_roi: 25.0 },
    { zone_h3: "s5", zone_name: "Hebbal", year: 2019, predicted_price: 5800, actual_price: 5600, predicted_3yr_roi: 31.0, actual_3yr_roi: 29.0 },
  ],
};
