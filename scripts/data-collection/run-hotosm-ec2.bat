@echo off
echo Uploading to EC2...
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" scripts\data-collection\process-hotosm.py ubuntu@34.224.33.158:/home/ubuntu/

echo.
echo Connecting to EC2 and starting collection...
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "cd /home/ubuntu && sudo apt-get install -y unzip && pip3 install -q pyshp requests && wget -q -O hotosm.zip 'https://s3.dualstack.us-east-1.amazonaws.com/production-raw-data-api/ISO3/NGA/buildings/polygons/hotosm_nga_buildings_polygons_shp.zip' && unzip -q hotosm.zip -d hotosm_nga && sed -i 's|D:\\\\ssabiroad\\\\data\\\\hotosm_nga|/home/ubuntu/hotosm_nga|g' process-hotosm.py && sed -i 's|D:\\\\ssabiroad\\\\data\\\\hotosm_collected|/home/ubuntu/hotosm_collected|g' process-hotosm.py && nohup python3 process-hotosm.py > hotosm.log 2>&1 & echo 'Started! Check: tail -f hotosm.log'"

echo.
echo Collection running on EC2!
echo To check progress: ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158 "tail -f /home/ubuntu/hotosm.log"
pause
