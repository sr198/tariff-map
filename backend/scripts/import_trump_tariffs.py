import csv
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials not found in environment variables")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

# Country name to ISO3 code mapping
# This is a simplified mapping for common countries
# For a complete solution, you would want to use a more comprehensive mapping
COUNTRY_TO_ISO3 = {
    'China': 'CHN',
    'European Union': 'EUU',  # Special code for EU
    'Vietnam': 'VNM',
    'Taiwan': 'TWN',
    'Japan': 'JPN',
    'India': 'IND',
    'South Korea': 'KOR',
    'Thailand': 'THA',
    'Switzerland': 'CHE',
    'Indonesia': 'IDN',
    'Malaysia': 'MYS',
    'Cambodia': 'KHM',
    'United Kingdom': 'GBR',
    'South Africa': 'ZAF',
    'Brazil': 'BRA',
    'Bangladesh': 'BGD',
    'Singapore': 'SGP',
    'Israel': 'ISR',
    'Philippines': 'PHL',
    'Chile': 'CHL',
    'Australia': 'AUS',
    'Pakistan': 'PAK',
    'Turkey': 'TUR',
    'Sri Lanka': 'LKA',
    'Colombia': 'COL',
    'Peru': 'PER',
    'Nicaragua': 'NIC',
    'Norway': 'NOR',
    'Costa Rica': 'CRI',
    'Jordan': 'JOR',
    'Dominican Republic': 'DOM',
    'United Arab Emirates': 'ARE',
    'New Zealand': 'NZL',
    'Argentina': 'ARG',
    'Ecuador': 'ECU',
    'Guatemala': 'GTM',
    'Honduras': 'HND',
    'Madagascar': 'MDG',
    'Myanmar (Burma)': 'MMR',
    'Tunisia': 'TUN',
    'Kazakhstan': 'KAZ',
    'Serbia': 'SRB',
    'Egypt': 'EGY',
    'Saudi Arabia': 'SAU',
    'El Salvador': 'SLV',
    'Côte d\'Ivoire': 'CIV',
    'Laos': 'LAO',
    'Botswana': 'BWA',
    'Trinidad and Tobago': 'TTO',
    'Morocco': 'MAR',
    'Papua New Guinea': 'PNG',
    'Malawi': 'MWI',
    'Liberia': 'LBR',
    'British Virgin Islands': 'VGB',
    'Afghanistan': 'AFG',
    'Zimbabwe': 'ZWE',
    'Benin': 'BEN',
    'Barbados': 'BRB',
    'Monaco': 'MCO',
    'Syria': 'SYR',
    'Uzbekistan': 'UZB',
    'Republic of the Congo': 'COG',
    'Djibouti': 'DJI',
    'French Polynesia': 'PYF',
    'Cayman Islands': 'CYM',
    'Kosovo': 'XKX',  # Not an official ISO code
    'Curaçao': 'CUW',
    'Vanuatu': 'VUT',
    'Rwanda': 'RWA',
    'Sierra Leone': 'SLE',
    'Mongolia': 'MNG',
    'San Marino': 'SMR',
    'Antigua and Barbuda': 'ATG',
    'Bermuda': 'BMU',
    'Eswatini': 'SWZ',
    'Marshall Islands': 'MHL',
    'Saint Pierre and Miquelon': 'SPM',
    'Saint Kitts and Nevis': 'KNA',
    'Turkmenistan': 'TKM',
    'Grenada': 'GRD',
    'Sudan': 'SDN',
    'Turks and Caicos Islands': 'TCA',
    'Aruba': 'ABW',
    'Montenegro': 'MNE',
    'Saint Helena': 'SHN',
    'Kyrgyzstan': 'KGZ',
    'Yemen': 'YEM',
    'Saint Vincent and the Grenadines': 'VCT',
    'Niger': 'NER',
    'Saint Lucia': 'LCA',
    'Nauru': 'NRU',
    'Equatorial Guinea': 'GNQ',
    'Iran': 'IRN',
    'Libya': 'LBY',
    'Samoa': 'WSM',
    'Guinea': 'GIN',
    'Timor-Leste': 'TLS',
    'Montserrat': 'MSR',
    'Chad': 'TCD',
    'Mali': 'MLI',
    'Algeria': 'DZA',
    'Oman': 'OMN',
    'Uruguay': 'URY',
    'Bahamas': 'BHS',
    'Lesotho': 'LSO',
    'Ukraine': 'UKR',
    'Bahrain': 'BHR',
    'Qatar': 'QAT',
    'Mauritius': 'MUS',
    'Fiji': 'FJI',
    'Iceland': 'ISL',
    'Kenya': 'KEN',
    'Liechtenstein': 'LIE',
    'Guyana': 'GUY',
    'Haiti': 'HTI',
    'Bosnia and Herzegovina': 'BIH',
    'Nigeria': 'NGA',
    'Namibia': 'NAM',
    'Brunei': 'BRN',
    'Bolivia': 'BOL',
    'Panama': 'PAN',
    'Venezuela': 'VEN',
    'North Macedonia': 'MKD',
    'Ethiopia': 'ETH',
    'Ghana': 'GHA',
    'Moldova': 'MDA',
    'Angola': 'AGO',
    'Democratic Republic of the Congo': 'COD',
    'Jamaica': 'JAM',
    'Mozambique': 'MOZ',
    'Paraguay': 'PRY',
    'Zambia': 'ZMB',
    'Lebanon': 'LBN',
    'Tanzania': 'TZA',
    'Iraq': 'IRQ',
    'Georgia': 'GEO',
    'Senegal': 'SEN',
    'Azerbaijan': 'AZE',
    'Cameroon': 'CMR',
    'Uganda': 'UGA',
    'Albania': 'ALB',
    'Armenia': 'ARM',
    'Nepal': 'NPL',
    'Sint Maarten': 'SXM',
    'Falkland Islands': 'FLK',
    'Gabon': 'GAB',
    'Kuwait': 'KWT',
    'Togo': 'TGO',
    'Suriname': 'SUR',
    'Belize': 'BLZ',
    'Maldives': 'MDV',
    'Tajikistan': 'TJK',
    'Cabo Verde': 'CPV',
    'Burundi': 'BDI',
    'Guadeloupe': 'GLP',
    'Bhutan': 'BTN',
    'Martinique': 'MTQ',
    'Tonga': 'TON',
    'Mauritania': 'MRT',
    'Dominica': 'DMA',
    'Micronesia': 'FSM',
    'Gambia': 'GMB',
    'French Guiana': 'GUF',
    'Christmas Island': 'CXR',
    'Andorra': 'AND',
    'Central African Republic': 'CAF',
    'Solomon Islands': 'SLB',
    'Mayotte': 'MYT',
    'Anguilla': 'AIA',
    'Cocos (Keeling) Islands': 'CCK',
    'Eritrea': 'ERI',
    'Cook Islands': 'COK',
    'South Sudan': 'SSD',
    'Comoros': 'COM',
    'Kiribati': 'KIR',
    'Sao Tome and Principe': 'STP',
    'Norfolk Island': 'NFK',
    'Gibraltar': 'GIB',
    'Tuvalu': 'TUV',
    'British Indian Ocean Territory': 'IOT',
    'Tokelau': 'TKL',
    'Guinea-Bissau': 'GNB',
    'Svalbard and Jan Mayen': 'SJM',
    'Heard and McDonald Islands': 'HMD',
    'Reunion': 'REU'
}

def import_trump_tariffs(csv_file_path):
    """
    Import Trump tariff data from CSV file into the tbl_trump_tariff table.
    """
    try:
        # Read the CSV file with utf-8-sig encoding to handle BOM
        with open(csv_file_path, 'r', encoding='utf-8-sig') as file:
            # Print the first few lines of the file for debugging
            print("First few lines of the CSV file:")
            for i, line in enumerate(file):
                if i < 5:  # Print first 5 lines
                    print(line.strip())
                else:
                    break
            
            # Reset file pointer to beginning
            file.seek(0)
            
            # Read the CSV file
            csv_reader = csv.DictReader(file)
            
            # Print the column names for debugging
            print("\nCSV columns:", csv_reader.fieldnames)
            
            # Process each row
            for row in csv_reader:
                try:
                    partner_name = row['partner_name']
                    trump_claimed_tariff = float(row['trump_claimed_tariff'])
                    us_reciprocal_tariff = float(row['us_reciprocal_tariff'])
                    
                    # Get ISO3 code for the country
                    partner_iso3 = COUNTRY_TO_ISO3.get(partner_name)
                    
                    if not partner_iso3:
                        print(f"Warning: No ISO3 code found for {partner_name}")
                        continue
                    
                    # Insert data into the table
                    data = {
                        'partner_iso3': partner_iso3,
                        'partner_name': partner_name,
                        'trump_claimed_tariff': trump_claimed_tariff,
                        'wto_reported_tariff': trump_claimed_tariff,  # Same as trump_claimed_tariff as requested
                        'us_reciprocal_tariff': us_reciprocal_tariff,
                        'source': 'CSV Import'
                    }
                    
                    # Insert the data into the table
                    result = supabase.table('tbl_trump_tariff').insert(data).execute()
                    
                    if hasattr(result, 'error') and result.error:
                        print(f"Error inserting data for {partner_name}: {result.error}")
                    else:
                        print(f"Successfully inserted data for {partner_name}")
                except KeyError as e:
                    print(f"Error: Missing column in CSV: {e}")
                    print("Available columns:", row.keys())
                    raise
                except ValueError as e:
                    print(f"Error converting value for {partner_name}: {e}")
                    print("Row data:", row)
                    raise
                except Exception as e:
                    print(f"Unexpected error processing row for {partner_name}: {e}")
                    print("Row data:", row)
                    raise
        
        print("Import completed successfully")
    
    except Exception as e:
        print(f"Error importing data: {str(e)}")
        raise

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_trump_tariffs.py <csv_file_path>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    import_trump_tariffs(csv_file_path) 