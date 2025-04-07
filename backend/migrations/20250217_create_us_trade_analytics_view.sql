-- Create a view for calculating trade deficits between countries
CREATE OR REPLACE VIEW public.vw_trade_deficits AS
WITH trade_balances AS (
    SELECT 
        year,
        reporter_iso3,
        partner_iso3,
        -- Calculate trade deficit (negative means deficit, positive means surplus)
        COALESCE(
            SUM(CASE 
                WHEN trade_flow_code = 6 THEN trade_value_usd -- Exports
                WHEN trade_flow_code = 5 THEN -trade_value_usd -- Imports
            END),
            0
        ) as trade_balance_thousands
    FROM public.tbl_trade_transactions
    GROUP BY year, reporter_iso3, partner_iso3
)
SELECT 
    year,
    reporter_iso3,
    partner_iso3,
    trade_balance_thousands
FROM trade_balances;

-- Add comment to the view
COMMENT ON VIEW public.vw_trade_deficits IS 'View calculating trade deficits between countries (values in thousands USD)';

-- Grant necessary permissions
GRANT SELECT ON public.vw_trade_deficits TO authenticated;
GRANT SELECT ON public.vw_trade_deficits TO service_role; 