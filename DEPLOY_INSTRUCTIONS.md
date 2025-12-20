# Manual Deployment Instructions

## Option 1: Use WinSCP (Easiest)
1. Download WinSCP: https://winscp.net/eng/download.php
2. Open WinSCP
3. New Site:
   - File protocol: SFTP
   - Host: 34.224.33.158
   - User: ec2-user
   - Advanced > SSH > Authentication > Private key: C:\Users\USER\Downloads\pic2nav-ml-key.pem
4. Login
5. Navigate to: /home/ec2-user/ml-models/api/
6. Upload: d:\ssabiroad\ml-models\api\main.py
7. Use PuTTY to restart server (see Option 2)

## Option 2: Use PuTTY
1. Download PuTTY: https://www.putty.org/
2. Convert PEM to PPK:
   - Open PuTTYgen
   - Load: C:\Users\USER\Downloads\pic2nav-ml-key.pem
   - Save private key as: pic2nav-ml-key.ppk
3. Open PuTTY:
   - Host: 34.224.33.158
   - Connection > SSH > Auth > Private key: pic2nav-ml-key.ppk
   - Open
4. Run commands:
   ```bash
   cd /home/ec2-user/ml-models
   pkill -f 'python.*main.py'
   nohup python3 -m api.main > ml_server.log 2>&1 &
   exit
   ```

## Option 3: Install OpenSSH on Windows
Run in PowerShell as Admin:
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```
Then run: .\deploy-ml.ps1

## Quick Test
After deployment, test:
```
curl http://34.224.33.158:8000/health
```
