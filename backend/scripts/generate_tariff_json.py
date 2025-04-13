import csv
import json
import argparse

def process_tariff_file(input_file: str, output_file: str):
    result = []

    try:
        with open(input_file, mode="r", encoding="ISO-8859-1") as f:
            reader = csv.DictReader(f, delimiter=",")

            for row in reader:
                print(f"Processing row: {row}")  # Debugging line to see the current row being processed
                if row["Tariff Year"] == "2023" and row["DutyType"].strip().upper() == "AHS":
                    try:
                        entry = {
                            "reporter_id": int(row["Reporter"]),
                            "partner_id": int(row["Partner"]),
                            "year": int(row["Tariff Year"]),
                            "simple_avg_tariff": float(row["Simple Average"]),
                            "weighted_avg_tariff": float(row["Weighted Average"]),
                            "max_tariff": float(row["Maximum Rate"]),
                            "num_tariff_lines": int(row["Nbr of Total Lines"]),
                            "domestic_peaks": int(row["Nbr of DomesticPeaks"]),
                            "international_peaks": int(row["Nbr of InternationalPeaks"]),
                            "import_value_usd": float(row["Imports Value in 1000 USD"]) * 1000
                        }
                        result.append(entry)
                    except Exception as e:
                        print(f"⚠️ Skipping row due to parse error: {e}")

        with open(output_file, "w", encoding="utf-8") as out:
            json.dump(result, out, indent=2)

        print(f"✅ Success: {len(result)} entries saved to {output_file}")

    except Exception as e:
        print(f"❌ Failed to read or process the file: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process WITS tariff CSV to JSON")
    parser.add_argument("input_file", help="Input tab-separated WITS CSV file")
    parser.add_argument("output_file", help="Output JSON file path")
    args = parser.parse_args()

    process_tariff_file(args.input_file, args.output_file)
