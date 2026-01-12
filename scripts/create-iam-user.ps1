# Create IAM user for SSABIRoad with RDS permissions

$USERNAME = "ssabiroad-admin"

Write-Host "Creating IAM user: $USERNAME" -ForegroundColor Green
aws iam create-user --user-name $USERNAME

Write-Host "`nAttaching RDS full access policy..." -ForegroundColor Green
aws iam attach-user-policy --user-name $USERNAME --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess

Write-Host "`nCreating access key..." -ForegroundColor Green
$KEY = aws iam create-access-key --user-name $USERNAME | ConvertFrom-Json

Write-Host "`n✅ IAM User Created!" -ForegroundColor Green
Write-Host "Username: $USERNAME"
Write-Host "Access Key ID: $($KEY.AccessKey.AccessKeyId)"
Write-Host "Secret Access Key: $($KEY.AccessKey.SecretAccessKey)"
Write-Host "`nAdd these to .env.local:"
Write-Host "AWS_ACCESS_KEY_ID=$($KEY.AccessKey.AccessKeyId)"
Write-Host "AWS_SECRET_ACCESS_KEY=$($KEY.AccessKey.SecretAccessKey)"
