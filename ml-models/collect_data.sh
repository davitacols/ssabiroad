#!/bin/bash
# Quick data collection script for EC2

echo "🔍 Starting data collection..."

cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate

# Set environment
export GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY:-AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho}"

# Run collection
python training/auto_collect.py

# Count collected data
echo ""
echo "📊 Data Summary:"
echo "Total images: $(find data -type f -name '*.jpg' -o -name '*.png' | wc -l)"
echo "Geolocation: $(find data/geolocations -type f -name '*.jpg' -o -name '*.png' | wc -l)"
echo "Landmarks: $(find data/landmarks -type f -name '*.jpg' -o -name '*.png' | wc -l)"
echo ""
echo "✅ Collection complete!"
