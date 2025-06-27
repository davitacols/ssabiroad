# Setup New Neon Database

1. Go to https://console.neon.tech
2. Create new project
3. Copy connection string
4. Replace DATABASE_URL in .env.local
5. Run: yarn prisma db push

Your current database might be suspended due to:
- Free tier limits exceeded
- Inactivity timeout
- Billing issues

Check your Neon dashboard for the exact reason.