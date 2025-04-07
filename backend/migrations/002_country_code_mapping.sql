-- Create a table to map between different ISO code variants
CREATE TABLE IF NOT EXISTS tbl_country_code_mapping (
    id SERIAL PRIMARY KEY,
    iso_alpha3 VARCHAR(3) NOT NULL,
    alternative_code VARCHAR(3) NOT NULL,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(iso_alpha3, alternative_code, source)
);

-- Insert some common mappings
INSERT INTO tbl_country_code_mapping (iso_alpha3, alternative_code, source) VALUES
    ('IRL', 'IRE', 'World Bank'),
    ('GBR', 'UK', 'World Bank'),
    ('GBR', 'UKG', 'World Bank'),
    ('USA', 'US', 'World Bank'),
    ('USA', 'USG', 'World Bank'),
    ('DEU', 'GER', 'World Bank'),
    ('FRA', 'FR', 'World Bank'),
    ('ITA', 'IT', 'World Bank'),
    ('ESP', 'ES', 'World Bank'),
    ('NLD', 'NL', 'World Bank'),
    ('JPN', 'JP', 'World Bank'),
    ('CHN', 'CN', 'World Bank'),
    ('IND', 'IN', 'World Bank'),
    ('BRA', 'BR', 'World Bank'),
    ('RUS', 'RU', 'World Bank'),
    ('CAN', 'CA', 'World Bank'),
    ('MEX', 'MX', 'World Bank'),
    ('KOR', 'KR', 'World Bank'),
    ('AUS', 'AU', 'World Bank'),
    ('ZAF', 'ZA', 'World Bank'),
    ('NPL', 'NP', 'World Bank')
ON CONFLICT (iso_alpha3, alternative_code, source) DO NOTHING; 