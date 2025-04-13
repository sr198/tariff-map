 create table public.tbl_country_codes (
  iso_alpha3 character varying not null,
  name text not null,
  code smallint null,
  constraint tbl_country_codes_pkey primary key (iso_alpha3)
) TABLESPACE pg_default;