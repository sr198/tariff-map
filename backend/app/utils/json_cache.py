from pathlib import Path
import json
from typing import Dict, Any, List
from functools import lru_cache

class JSONCache:
    _instance = None
    _data: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(JSONCache, cls).__new__(cls)
            cls._instance._load_all_json_files()
        return cls._instance

    def _load_all_json_files(self):
        """Load all JSON files from the data directory into memory"""
        data_dir = Path(__file__).parent.parent.parent / 'data'
        
        # List of JSON files to load
        json_files = [
            'us_tariff_commentary.json',
            'us_tariff_full_summary.json',
            'us_tariff_summary.json',
            'us_tariff_on_world.json',
            'world_tariff_on_us.json',
            'country_reference.json'
        ]

        for file_name in json_files:
            file_path = data_dir / file_name
            if file_path.exists():
                try:
                    with open(file_path, 'r') as f:
                        self._data[file_name] = json.load(f)
                except Exception as e:
                    print(f"Error loading {file_name}: {str(e)}")

    def get(self, file_name: str) -> Any:
        """Get data from a specific JSON file"""
        return self._data.get(file_name)

    def get_tariff_commentary(self) -> Dict[str, Any]:
        """Get tariff commentary data"""
        return self._data.get('us_tariff_commentary.json', {})

    def get_trump_tariffs(self) -> List[Dict[str, Any]]:
        """Get Trump tariff data"""
        return self._data.get('us_tariff_full_summary.json', [])

    def get_country_reference(self) -> Dict[str, Any]:
        """Get country reference data"""
        return self._data.get('country_reference.json', {})

# Create a singleton instance
json_cache = JSONCache() 