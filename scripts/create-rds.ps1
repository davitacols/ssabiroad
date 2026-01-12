# Create RDS PostgreSQL for SSABIRoad

$DB_INSTANCE_ID = "ssabiroad-db"
$DB_NAME = "ssabiroad"
$DB_USERNAME = "ssabiroad_admin"
$DB_PASSWORD = "SSABIRoad2026SecurePass!"
$DB_CLASS = "db.t3.micro"
$REGION = "us-east-2"

Write-Host "Creating RDS PostgreSQL instance..." -ForegroundColor Green

aws rds create-db-instance `
    --db-instance-identifier $DB_INSTANCE_ID `
    --db-instance-class $DB_CLASS `
    --engine postgres `
    --engine-version 15.5 `
    --master-username $DB_USERNAME `
    --master-user-password $DB_PASSWORD `
    --allocated-storage 20 `
    --storage-type gp3 `
    --db-name $DB_NAME `
    --publicly-accessible `
    --backup-retention-period 7 `
    --region $REGION `
    --no-multi-az `
    --storage-encrypted

Write-Host "`nWaiting for instance (5-10 minutes)..." -ForegroundColor Yellow
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $REGION

$ENDPOINT = aws rds describe-db-instances `
    --db-instance-identifier $DB_INSTANCE_ID `
    --region $REGION `
    --query 'DBInstances[0].Endpoint.Address' `
    --output text

Write-Host "`n✅ RDS Instance Created!" -ForegroundColor Green
Write-Host "Endpoint: $ENDPOINT"
Write-Host "Database: $DB_NAME"
Write-Host "Username: $DB_USERNAME"
Write-Host "Password: $DB_PASSWORD"
Write-Host "`nConnection string:"
Write-Host "postgresql://${DB_USERNAME}:${DB_PASSWORD}@${ENDPOINT}:5432/${DB_NAME}"
