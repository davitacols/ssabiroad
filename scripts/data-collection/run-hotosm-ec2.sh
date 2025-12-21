#!/bin/bash

# Upload script to EC2
scp -i "C:/Users/USER/Downloads/pic2nav-ml-key.pem" scripts/data-collection/process-hotosm.py ubuntu@34.224.33.158:/home/ubuntu/

# SSH and run
ssh -i "C:/Users/USER/Downloads/pic2nav-ml-key.pem" ubuntu@34.224.33.158 << 'EOF'
cd /home/ubuntu

# Install dependencies
pip3 install pyshp requests

# Download HOT OSM data
echo "Downloading HOT OSM Nigeria buildings..."
wget -O hotosm_nga.zip "https://s3.dualstack.us-east-1.amazonaws.com/production-raw-data-api/ISO3/NGA/buildings/polygons/hotosm_nga_buildings_polygons_shp.zip"

# Extract
echo "Extracting..."
unzip -q hotosm_nga.zip -d hotosm_nga/

# Update script paths
sed -i 's|D:\\\\ssabiroad\\\\data\\\\hotosm_nga|/home/ubuntu/hotosm_nga|g' process-hotosm.py
sed -i 's|D:\\\\ssabiroad\\\\data\\\\hotosm_collected|/home/ubuntu/hotosm_collected|g' process-hotosm.py
sed -i "s|YOUR_API_KEY|$GOOGLE_MAPS_API_KEY|g" process-hotosm.py

# Run collection in background
echo "Starting collection..."
nohup python3 process-hotosm.py > hotosm.log 2>&1 &

echo "Collection started! Check progress:"
echo "  ssh -i pic2nav-ml-key.pem ubuntu@34.224.33.158 'tail -f hotosm.log'"
EOF
