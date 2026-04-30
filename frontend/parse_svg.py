import re
import json

svg = """$(curl -s -L https://code.highcharts.com/mapdata/countries/et/et-all.svg)"""

paths = {}
matches = re.findall(r'<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"', svg)
for pid, d in matches:
    paths[pid] = d

# Mapping Highcharts IDs to our location names/regions
id_map = {
    'ET.AA': 'Addis Ababa',
    'ET.AF': 'Afar',
    'ET.AM': 'Amhara',
    'ET.BE': 'Benshangul-Gumaz',
    'ET.DD': 'Dire Dawa',
    'ET.GA': 'Gambela Peoples',
    'ET.HA': 'Harari People',
    'ET.OR': 'Oromia',
    'ET.SN': 'SNNPR',
    'ET.SO': 'Somali',
    'ET.TI': 'Tigray'
}

result = {}
for pid, d in paths.items():
    if pid in id_map:
        result[id_map[pid]] = d

with open('src/components/ethiopia-region-paths.json', 'w') as f:
    json.dump(result, f, indent=2)

print("Extracted", len(result), "regions")
