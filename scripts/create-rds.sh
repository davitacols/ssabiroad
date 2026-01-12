#!/bin/bash
# Create RDS PostgreSQL for SSABIRoad

DB_INSTANCE_ID="ssabiroad-db"
DB_NAME="ssabiroad"
DB_USERNAME="ssabiroad_admin"
DB_PASSWORD="SSABIRoad2026SecurePass!"
DB_CLASS="db.t3.micro"  # Free tier eligible
REGION="us-east-2"

echo "Creating RDS PostgreSQL instance..."

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class $DB_CLASS \
    --engine postgres \
    --engine-version 15.5 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name $DB_NAME \
    --publicly-accessible \
    --backup-retention-period 7 \
    --region $REGION \
    --no-multi-az \
    --storage-encrypted

echo ""
echo "Waiting for instance to be available (this takes 5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $REGION

echo ""
echo "Getting endpoint..."
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo ""
echo "✅ RDS Instance Created!"
echo "Endpoint: $ENDPOINT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "Password: $DB_PASSWORD"
echo ""
echo "Connection string:"
echo "postgresql://$DB_USERNAME:$DB_PASSWORD@$ENDPOINT:5432/$DB_NAME"
