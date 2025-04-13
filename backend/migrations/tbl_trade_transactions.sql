create table public.tbl_trade_transactions (
  id serial not null,
  year integer not null,
  nomenclature text null,
  reporter_iso3 text not null,
  reporter_name text null,
  partner_iso3 text not null,
  partner_name text null,
  trade_flow text null,
  trade_flow_code integer null,
  trade_value_usd real not null,
  constraint tbl_trade_transactions_pkey primary key (id),
  constraint tbl_trade_transactions_trade_flow_check check (
    (
      trade_flow = any (array['Export'::text, 'Import'::text])
    )
  )
) TABLESPACE pg_default;