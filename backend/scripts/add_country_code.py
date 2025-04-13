import json
from pathlib import Path
import pandas as pd
import argparse

def normalize(name):
    return str(name).strip().lower()

def load_country_lookup(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        countries = json.load(f)
    return {
        normalize(entry['name']): {
            'id': entry.get('id'),
            'iso3_code': entry['iso3_code'],
            'name': entry['name']
        } for entry in countries
    }

def generate_tariff_json(countries_json, tariffs_csv):
    country_lookup = load_country_lookup(countries_json)
    df = pd.read_csv(tariffs_csv)
    result = []

    for _, row in df.iterrows():
        country_name = normalize(row['Country_DW'])
        if country_name in country_lookup:
            entry = {
                "iso3_code": country_lookup[country_name]['iso3_code'],
                "name": country_lookup[country_name]['name'],
                "tariff_rate_1": str(row['Tariff_rate_1']),
                "tariff_rate_2": str(row['Tariff_rate_2'])
            }
            result.append(entry)

    return result

def enrich_tariff_json(tariff_json, countries_json):
    with open(tariff_json, 'r', encoding='utf-8') as f:
        tariff_data = json.load(f)

    country_lookup = load_country_lookup(countries_json)
    enriched = []

    for entry in tariff_data:
        country_name = normalize(entry['name'])
        if country_name in country_lookup:
            enriched_entry = {
                "id": country_lookup[country_name]['id'],
                **entry
            }
            enriched.append(enriched_entry)

    return enriched

def main():
    parser = argparse.ArgumentParser(description="Tariff tool: generate or enrich tariff JSON")
    parser.add_argument("--mode", required=True, choices=["generate", "enrich"], help="Mode: generate or enrich")
    parser.add_argument("--countries", required=True, help="Path to country codes JSON file")
    parser.add_argument("--tariffs", help="Path to tariff CSV file (only for generate mode)")
    parser.add_argument("--tariff_json", help="Path to tariff JSON file (only for enrich mode)")
    parser.add_argument("--output", required=True, help="Path to output JSON file")

    args = parser.parse_args()

    if args.mode == "generate":
        if not args.tariffs:
            parser.error("--tariffs is required in generate mode")
        result = generate_tariff_json(args.countries, args.tariffs)

    elif args.mode == "enrich":
        if not args.tariff_json:
            parser.error("--tariff_json is required in enrich mode")
        result = enrich_tariff_json(args.tariff_json, args.countries)

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    print(f"✅ Output saved to {args.output}")

if __name__ == "__main__":
    main()
