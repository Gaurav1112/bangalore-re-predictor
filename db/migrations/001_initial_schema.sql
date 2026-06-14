-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ── Transactions (ground truth from Karnataka IGR / Kaveri) ──────────────────
CREATE TABLE transactions (
    id              BIGSERIAL PRIMARY KEY,
    zone_h3         TEXT NOT NULL,          -- H3 cell ID at resolution 8
    geom            GEOMETRY(Point, 4326),
    price_per_sqft  NUMERIC(10,2) NOT NULL,
    total_price     NUMERIC(14,2),
    area_sqft       NUMERIC(10,2),
    property_type   TEXT,                   -- apartment/villa/plot
    transaction_date DATE NOT NULL,
    source          TEXT DEFAULT 'kaveri',
    raw_doc_no      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
SELECT create_hypertable('transactions', 'transaction_date', if_not_exists => TRUE);
CREATE INDEX ON transactions (zone_h3, transaction_date DESC);
CREATE INDEX ON transactions USING GIST (geom);

-- ── Feature snapshots (append-only; backtest integrity) ─────────────────────
CREATE TABLE features (
    id                      BIGSERIAL PRIMARY KEY,
    zone_h3                 TEXT NOT NULL,
    snapshot_date           DATE NOT NULL,

    -- A. Transport & Connectivity
    metro_dist_m            NUMERIC(8,1),
    metro_phase             SMALLINT,       -- 1=operational, 2=under_construction, 3=planned
    prr_alignment           BOOLEAN DEFAULT FALSE,
    kride_node_dist_m       NUMERIC(8,1),
    airport_metro           BOOLEAN DEFAULT FALSE,
    redbus_freq_daily       NUMERIC(6,1),
    highway_dist_m          NUMERIC(8,1),
    orr_alignment           BOOLEAN DEFAULT FALSE,
    airport_dist_km         NUMERIC(6,2),
    airport_noise_contour   BOOLEAN DEFAULT FALSE,
    nh_onramp_dist_m        NUMERIC(8,1),
    railway_dist_m          NUMERIC(8,1),
    walkability_score       NUMERIC(4,1),
    feeder_bus_count        SMALLINT,
    commute_9am_min         NUMERIC(5,1),
    road_width_m            NUMERIC(5,1),
    metro_line              TEXT,
    brts_dist_m             NUMERIC(8,1),
    proposed_infra_count    SMALLINT DEFAULT 0,
    strr_alignment          BOOLEAN DEFAULT FALSE,

    -- B. Employment & Demand
    it_park_dist_m          NUMERIC(8,1),
    office_absorption_sqft  NUMERIC(12,0),
    epfo_growth_pct         NUMERIC(6,2),
    startup_density         NUMERIC(6,2),
    zomato_density          NUMERIC(6,2),
    cbd_commute_min         NUMERIC(5,1),
    gcc_announcement        BOOLEAN DEFAULT FALSE,

    -- C. Environment & Geography
    lake_dist_m             NUMERIC(8,1),
    lake_bod_mgl            NUMERIC(6,2),
    elevation_m             NUMERIC(7,1),
    flood_risk_score        SMALLINT,       -- 0-3
    ndvi                    NUMERIC(5,3),
    pm25_annual             NUMERIC(6,2),
    noise_db                NUMERIC(5,1),
    bwssb_coverage          BOOLEAN DEFAULT TRUE,
    lst_celsius             NUMERIC(5,1),

    -- D. Commercial & Social
    mall_dist_m             NUMERIC(8,1),
    dmart_flag              BOOLEAN DEFAULT FALSE,
    grocery_score           NUMERIC(4,1),
    restaurant_density      NUMERIC(6,2),
    microbrewery_count      SMALLINT DEFAULT 0,
    coworking_seats         INTEGER DEFAULT 0,
    gentrification_stage    SMALLINT,       -- 0-4
    builder_tier            SMALLINT,       -- 1-3
    gated_ratio_pct         NUMERIC(5,2),
    rwa_strength            SMALLINT,       -- 0-10
    crime_rate_index        NUMERIC(5,2),
    street_lighting_pct     NUMERIC(5,2),
    google_trends_velocity  NUMERIC(6,2),
    days_on_market          NUMERIC(5,1),
    social_sentiment_score  NUMERIC(5,3),

    -- E. Education
    top_school_dist_m       NUMERIC(8,1),
    school_board_tier       SMALLINT,       -- 0-3
    school_cluster_count    SMALLINT,
    ib_icse_dist_m          NUMERIC(8,1),
    coaching_density        NUMERIC(5,2),
    eng_college_dist_m      NUMERIC(8,1),

    -- F. Healthcare
    hospital_dist_m         NUMERIC(8,1),
    hospital_cluster_count  SMALLINT,
    hospital_private_flag   BOOLEAN,
    primary_care_density    NUMERIC(5,2),

    -- G. Policy & Regulatory
    bda_zone                TEXT,
    bbmp_expansion          BOOLEAN DEFAULT FALSE,
    fsi_allowed             NUMERIC(4,2),
    khata_type              CHAR(1),        -- A or B
    jurisdiction            TEXT,           -- BBMP/BDA/GP
    ec_status               TEXT,
    rera_flag               BOOLEAN DEFAULT TRUE,
    akrama_sakrama          BOOLEAN DEFAULT FALSE,
    guidance_value_delta_pct NUMERIC(6,2),
    kiadb_sez_dist_m        NUMERIC(8,1),

    -- H. Macro-Economic
    rbi_repo_rate           NUMERIC(5,2),
    home_loan_rate          NUMERIC(5,2),
    emi_affordability_idx   NUMERIC(6,3),
    housing_credit_yoy_pct  NUMERIC(6,2),
    usd_inr_3m_avg          NUMERIC(7,2),
    nri_deposit_inflow_bn   NUMERIC(8,2),
    nifty_it_12m_return_pct NUMERIC(7,2),
    nifty_it_pe             NUMERIC(6,2),
    pe_re_invest_blr_usd_m  NUMERIC(10,2),
    rental_yield_pct        NUMERIC(5,2),
    embassy_reit_yield_pct  NUMERIC(5,2),
    cpi_yoy_pct             NUMERIC(5,2),

    -- I. Supply-Side Dynamics
    months_of_inventory     NUMERIC(5,1),
    launch_velocity         INTEGER,
    price_cut_pct           NUMERIC(5,2),
    builder_delay_rate      NUMERIC(5,2),
    land_acq_velocity       INTEGER,
    construction_cost_idx   NUMERIC(7,2),
    approval_pipeline       INTEGER,
    prelaunch_resale_spread NUMERIC(6,2),
    segment_supply_mix      JSONB,
    stalled_project_pct     NUMERIC(5,2),

    -- K. Utility Infrastructure
    bescom_saidi_hr         NUMERIC(6,2),
    bwssb_supply_hrs        NUMERIC(4,1),
    water_tds               NUMERIC(6,1),
    telecom_tower_dist_m    NUMERIC(8,1),
    ev_charging_density     NUMERIC(5,2),

    -- L. Demographics & Alt Data
    viirs_ntl_growth_pct    NUMERIC(7,2),
    linkedin_job_density    NUMERIC(7,2),
    gst_reg_growth_pct      NUMERIC(6,2),
    vahan_4w_growth_pct     NUMERIC(6,2),
    udise_enrollment_growth NUMERIC(6,2),
    ward_pop_proxy_growth   NUMERIC(6,2),
    airbnb_density          NUMERIC(5,2),
    gmaps_review_velocity   NUMERIC(7,2),
    age_2535_pct            NUMERIC(5,2),
    migration_inflow_proxy  NUMERIC(7,2),

    -- Derived / structural
    post_rera               BOOLEAN GENERATED ALWAYS AS (snapshot_date >= '2017-07-10') STORED,
    supply_x_rera           NUMERIC GENERATED ALWAYS AS (
        CASE WHEN snapshot_date >= '2017-07-10' THEN months_of_inventory ELSE 0 END
    ) STORED,

    UNIQUE (zone_h3, snapshot_date)
);
CREATE INDEX ON features (zone_h3, snapshot_date DESC);

-- ── Zone metadata ─────────────────────────────────────────────────────────────
CREATE TABLE zones (
    h3_id           TEXT PRIMARY KEY,
    name            TEXT,                   -- human-readable name e.g. "Sarjapur Road"
    geom            GEOMETRY(Polygon, 4326),
    micro_market    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON zones USING GIST (geom);

-- ── Metro stations reference ─────────────────────────────────────────────────
CREATE TABLE metro_stations (
    id              SERIAL PRIMARY KEY,
    station_name    TEXT NOT NULL,
    line            TEXT,
    phase           SMALLINT,
    status          TEXT,                   -- operational/under_construction/planned
    geom            GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX ON metro_stations USING GIST (geom);

-- ── IT parks reference ───────────────────────────────────────────────────────
CREATE TABLE it_parks (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    total_sqft      NUMERIC(12,0),
    geom            GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX ON it_parks USING GIST (geom);

-- ── Schools reference ────────────────────────────────────────────────────────
CREATE TABLE schools (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    board           TEXT,                   -- IB/ICSE/CBSE/State
    board_tier      SMALLINT,
    geom            GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX ON schools USING GIST (geom);

-- ── Hospitals reference ──────────────────────────────────────────────────────
CREATE TABLE hospitals (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    is_private      BOOLEAN,
    geom            GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX ON hospitals USING GIST (geom);

-- ── News cache ───────────────────────────────────────────────────────────────
CREATE TABLE news (
    id              BIGSERIAL PRIMARY KEY,
    zone_h3         TEXT,
    headline        TEXT NOT NULL,
    url             TEXT UNIQUE NOT NULL,
    url_hash        TEXT UNIQUE NOT NULL,
    published_at    TIMESTAMPTZ,
    signal_type     TEXT,                   -- infrastructure/market/policy/employment
    sentiment       NUMERIC(4,3),           -- -1.0 to +1.0
    scraped_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON news (zone_h3, published_at DESC);

-- ── Model runs (mirrors MLflow, for fast API queries) ───────────────────────
CREATE TABLE model_runs (
    id              SERIAL PRIMARY KEY,
    mlflow_run_id   TEXT UNIQUE NOT NULL,
    train_end_date  DATE NOT NULL,
    mape            NUMERIC(6,3),
    rmse            NUMERIC(10,2),
    promoted        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
