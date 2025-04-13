create view public.view_trade_summary as
with
  trade_agg as (
    select
      t.year,
      t.reporter_iso3,
      t.partner_iso3,
      sum(
        case
          when t.trade_flow_code = 5 then t.trade_value_usd
          else 0::real
        end
      ) as export_value_usd,
      sum(
        case
          when t.trade_flow_code = 6 then t.trade_value_usd
          else 0::real
        end
      ) as import_value_usd
    from
      tbl_trade_transactions t
    group by
      t.year,
      t.reporter_iso3,
      t.partner_iso3
  )
select
  ta.year,
  ta.reporter_iso3,
  r.name as reporter_name,
  r.code as reporter_code,
  ta.partner_iso3,
  p.name as partner_name,
  p.code as partner_code,
  ta.export_value_usd,
  ta.import_value_usd,
  ta.import_value_usd - ta.export_value_usd as trade_deficit_usd
from
  trade_agg ta
  left join tbl_country_codes r on ta.reporter_iso3 = r.iso_alpha3::text
  left join tbl_country_codes p on ta.partner_iso3 = p.iso_alpha3::text;