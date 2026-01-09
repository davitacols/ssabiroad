# Restart ML API on EC2
$EC2_INSTANCE_ID = "i-0a1b2c3d4e5f6g7h8"  # Replace with actual instance ID
$REGION = "us-east-1"

Write-Host "🔄 Restarting ML API..."

# Send command to EC2 instance via Systems Manager
$command = @"
cd /home/ec2-user/ml-models/api
pkill -f 'python.*main.py'
sleep 2
nohup python3 main.py > ml-server.log 2>&1 &
sleep 3
curl -s http://localhost:8000/health
"@

# Using AWS Systems Manager to run command
aws ssm send-command `
  --instance-ids $EC2_INSTANCE_ID `
  --document-name "AWS-RunShellScript" `
  --parameters "commands=$command" `
  --region $REGION

Write-Host "✅ Restart command sent"
Write-Host "Testing API in 5 seconds..."
Start-Sleep -Seconds 5

$response = curl -s http://34.224.33.158:8000/health
Write-Host "API Response: $response"
