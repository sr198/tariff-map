-- Create the tbl_trump_tariff table
CREATE TABLE IF NOT EXISTS public.tbl_trump_tariff (
    id SERIAL PRIMARY KEY,
    partner_iso3 VARCHAR(3) NOT NULL,
    partner_name VARCHAR(100) NOT NULL,
    trump_claimed_tariff NUMERIC(5,2) NOT NULL,
    wto_reported_tariff NUMERIC(5,2) NOT NULL,
    us_reciprocal_tariff NUMERIC(5,2) NOT NULL,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_iso3)
);

-- Add comment to the table
COMMENT ON TABLE public.tbl_trump_tariff IS 'Table storing Trump administration tariff data';

-- Grant necessary permissions
GRANT SELECT ON public.tbl_trump_tariff TO authenticated;
GRANT SELECT ON public.tbl_trump_tariff TO service_role; 