create view public.view_tariff_summary as
select
  tr.year,
  r.iso_alpha3 as reporter_iso3,
  r.name as reporter_name,
  r.code as reporter_code,
  p.iso_alpha3 as partner_iso3,
  p.name as partner_name,
  p.code as partner_code,
  tr.tariff_type,
  tr.simple_average,
  tr.weighted_average
from
  tbl_tariff_rates tr
  left join tbl_country_codes r on tr.reporter_code = r.code
  left join tbl_country_codes p on tr.partner_code = p.code;