-- Seed reference data for development and testing

-- Metro stations (Namma Metro, Bangalore)
INSERT INTO metro_stations (station_name, line, phase, status, geom) VALUES
('Whitefield', 'Purple', 1, 'operational', ST_SetSRID(ST_MakePoint(77.7509, 12.9698), 4326)),
('Marathahalli', 'Purple', 1, 'operational', ST_SetSRID(ST_MakePoint(77.7019, 12.9562), 4326)),
('Indiranagar', 'Purple', 1, 'operational', ST_SetSRID(ST_MakePoint(77.6408, 12.9784), 4326)),
('MG Road', 'Purple', 1, 'operational', ST_SetSRID(ST_MakePoint(77.6194, 12.9756), 4326)),
('Baiyappanahalli', 'Purple', 1, 'operational', ST_SetSRID(ST_MakePoint(77.6587, 12.9980), 4326)),
('Hebbal', 'Yellow', 2, 'under_construction', ST_SetSRID(ST_MakePoint(77.5944, 13.0350), 4326)),
('Devanahalli', 'Yellow', 2, 'under_construction', ST_SetSRID(ST_MakePoint(77.7124, 13.2474), 4326)),
('Electronic City', 'Green', 2, 'under_construction', ST_SetSRID(ST_MakePoint(77.6671, 12.8399), 4326)),
('Kempegowda', 'Green', 1, 'operational', ST_SetSRID(ST_MakePoint(77.5695, 12.9772), 4326)),
('Koramangala', 'Green', 3, 'planned', ST_SetSRID(ST_MakePoint(77.6269, 12.9352), 4326));

-- IT parks
INSERT INTO it_parks (name, total_sqft, geom) VALUES
('Manyata Tech Park', 12500000, ST_SetSRID(ST_MakePoint(77.6204, 13.0459), 4326)),
('Embassy Tech Village', 6800000, ST_SetSRID(ST_MakePoint(77.7024, 12.9379), 4326)),
('Bagmane Tech Park', 4500000, ST_SetSRID(ST_MakePoint(77.6456, 12.9762), 4326)),
('RMZ Ecospace', 3200000, ST_SetSRID(ST_MakePoint(77.6882, 12.9290), 4326)),
('Global Village Tech Park', 5000000, ST_SetSRID(ST_MakePoint(77.5092, 12.8951), 4326)),
('Electronic City Phase 1', 8000000, ST_SetSRID(ST_MakePoint(77.6691, 12.8450), 4326)),
('EPIP Zone Whitefield', 6000000, ST_SetSRID(ST_MakePoint(77.7380, 12.9698), 4326));

-- Schools
INSERT INTO schools (name, board, board_tier, geom) VALUES
('The International School Bangalore', 'IB', 3, ST_SetSRID(ST_MakePoint(77.5614, 12.8986), 4326)),
('Greenwood High International', 'IB', 3, ST_SetSRID(ST_MakePoint(77.6424, 13.0012), 4326)),
('Bishop Cotton Boys School', 'ICSE', 2, ST_SetSRID(ST_MakePoint(77.5961, 12.9791), 4326)),
('National Public School', 'CBSE', 1, ST_SetSRID(ST_MakePoint(77.5936, 12.9340), 4326)),
('DPS Bangalore East', 'CBSE', 1, ST_SetSRID(ST_MakePoint(77.7221, 13.0012), 4326)),
('Inventure Academy', 'IB', 3, ST_SetSRID(ST_MakePoint(77.6849, 12.9191), 4326)),
('Vidyashilp Academy', 'ICSE', 2, ST_SetSRID(ST_MakePoint(77.5871, 13.0601), 4326));

-- Hospitals
INSERT INTO hospitals (name, is_private, geom) VALUES
('Manipal Hospital HAL', true, ST_SetSRID(ST_MakePoint(77.6408, 12.9611), 4326)),
('Sakra World Hospital', true, ST_SetSRID(ST_MakePoint(77.6731, 12.9355), 4326)),
('Narayana Health City', true, ST_SetSRID(ST_MakePoint(77.6381, 12.8676), 4326)),
('Bangalore Baptist Hospital', false, ST_SetSRID(ST_MakePoint(77.5931, 13.0312), 4326)),
('Fortis Hospital Bannerghatta', true, ST_SetSRID(ST_MakePoint(77.6021, 12.8780), 4326)),
('NIMHANS', false, ST_SetSRID(ST_MakePoint(77.5839, 12.9432), 4326));

-- Key zones (H3 cells approximated with centroids)
INSERT INTO zones (h3_id, name, micro_market, geom) VALUES
('8a3d3a2d9ffffff', 'Sarjapur Road', 'East Bangalore', ST_SetSRID(ST_MakePoint(77.6880, 12.9121), 4326)),
('8a3d3a2c9ffffff', 'Whitefield', 'East Bangalore', ST_SetSRID(ST_MakePoint(77.7480, 12.9698), 4326)),
('8a3d3a119ffffff', 'Koramangala', 'South Bangalore', ST_SetSRID(ST_MakePoint(77.6270, 12.9352), 4326)),
('8a3d3a127ffffff', 'HSR Layout', 'South Bangalore', ST_SetSRID(ST_MakePoint(77.6442, 12.9116), 4326)),
('8a3d3a2a9ffffff', 'Indiranagar', 'East Bangalore', ST_SetSRID(ST_MakePoint(77.6408, 12.9784), 4326)),
('8a3d3a3a1ffffff', 'Devanahalli', 'North Bangalore', ST_SetSRID(ST_MakePoint(77.7121, 13.2474), 4326)),
('8a3d3a301ffffff', 'Hebbal', 'North Bangalore', ST_SetSRID(ST_MakePoint(77.5944, 13.0350), 4326)),
('8a3d3a117ffffff', 'Electronic City', 'South Bangalore', ST_SetSRID(ST_MakePoint(77.6691, 12.8450), 4326)),
('8a3d3a109ffffff', 'Bannerghatta Road', 'South Bangalore', ST_SetSRID(ST_MakePoint(77.6021, 12.8780), 4326)),
('8a3d3a28dffffff', 'Marathahalli', 'East Bangalore', ST_SetSRID(ST_MakePoint(77.7019, 12.9562), 4326));

-- Sample transactions (historic, for backtest validation)
INSERT INTO transactions (zone_h3, price_per_sqft, total_price, area_sqft, property_type, transaction_date, source) VALUES
('8a3d3a2d9ffffff', 4200, 4200000, 1000, 'apartment', '2015-03-15', 'kaveri'),
('8a3d3a2d9ffffff', 5100, 5100000, 1000, 'apartment', '2017-06-20', 'kaveri'),
('8a3d3a2d9ffffff', 7400, 7400000, 1000, 'apartment', '2020-09-10', 'kaveri'),
('8a3d3a2d9ffffff', 9800, 9800000, 1000, 'apartment', '2024-01-15', 'kaveri'),
('8a3d3a2c9ffffff', 3800, 3800000, 1000, 'apartment', '2015-04-10', 'kaveri'),
('8a3d3a2c9ffffff', 4600, 4600000, 1000, 'apartment', '2017-08-15', 'kaveri'),
('8a3d3a2c9ffffff', 6800, 6800000, 1000, 'apartment', '2020-11-20', 'kaveri'),
('8a3d3a2c9ffffff', 9200, 9200000, 1000, 'apartment', '2024-02-10', 'kaveri'),
('8a3d3a3a1ffffff', 1800, 3600000, 2000, 'plot', '2015-06-01', 'kaveri'),
('8a3d3a3a1ffffff', 2800, 5600000, 2000, 'plot', '2017-09-15', 'kaveri'),
('8a3d3a3a1ffffff', 5200, 10400000, 2000, 'plot', '2020-08-20', 'kaveri'),
('8a3d3a3a1ffffff', 8100, 16200000, 2000, 'plot', '2024-03-05', 'kaveri');

-- Sample feature snapshot (for dev/testing without running full pipeline)
INSERT INTO features (
    zone_h3, snapshot_date,
    metro_dist_m, metro_phase, it_park_dist_m,
    epfo_growth_pct, zomato_density, redbus_freq_daily,
    flood_risk_score, dmart_flag, gentrification_stage,
    months_of_inventory, viirs_ntl_growth_pct,
    rbi_repo_rate, nifty_it_12m_return_pct, rental_yield_pct,
    school_board_tier, ib_icse_dist_m,
    guidance_value_delta_pct, rera_flag,
    bwssb_coverage, bwssb_supply_hrs, ev_charging_density
) VALUES
('8a3d3a2d9ffffff', CURRENT_DATE,
    1200, 1, 800,
    38.5, 92.0, 45.0,
    1, true, 2,
    9.0, 24.3,
    6.5, 36.0, 4.2,
    3, 1500.0,
    28.0, true,
    true, 18.0, 2.1),
('8a3d3a2c9ffffff', CURRENT_DATE,
    480, 1, 400,
    42.1, 128.0, 68.0,
    0, true, 3,
    8.0, 31.2,
    6.5, 36.0, 3.8,
    2, 2200.0,
    28.0, true,
    true, 20.0, 3.5),
('8a3d3a3a1ffffff', CURRENT_DATE,
    8500, 2, 12000,
    28.4, 18.0, 12.0,
    0, false, 1,
    11.0, 42.8,
    6.5, 36.0, 4.9,
    1, 8000.0,
    28.0, true,
    false, 12.0, 0.5);
