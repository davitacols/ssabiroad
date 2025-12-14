"""Extract Nigerian buildings from OpenStreetMap"""
import requests
import json
from pathlib import Path

def download_osm_buildings():
    """Download building footprints from OpenStreetMap Overpass API"""
    
    # Nigeria bounding box
    bbox = "4.0,6.0,14.0,14.0"  # min_lon, min_lat, max_lon, max_lat
    
    # Overpass API query for buildings
    query = f"""
    [out:json][timeout:300];
    (
      way["building"](4.0,6.0,14.0,14.0);
      relation["building"](4.0,6.0,14.0,14.0);
    );
    out center;
    """
    
    print("📥 Downloading Nigerian buildings from OpenStreetMap...")
    print("⏳ This may take 5-10 minutes...")
    
    try:
        response = requests.post(
            "https://overpass-api.de/api/interpreter",
            data=query,
            timeout=600
        )
        
        if response.status_code == 200:
            data = response.json()
            buildings = []
            
            for element in data.get("elements", []):
                if "center" in element:
                    buildings.append({
                        "id": element["id"],
                        "latitude": element["center"]["lat"],
                        "longitude": element["center"]["lon"],
                        "tags": element.get("tags", {})
                    })
            
            output_file = Path("data/nigeria_osm_buildings.json")
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, "w") as f:
                json.dump(buildings, f, indent=2)
            
            print(f"✅ Downloaded {len(buildings)} buildings")
            print(f"📁 Saved to: {output_file}")
            print(f"\n📊 Sample building:")
            if buildings:
                print(json.dumps(buildings[0], indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Alternative: Download from https://download.geofabrik.de/africa/nigeria.html")

if __name__ == "__main__":
    download_osm_buildings()
