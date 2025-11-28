# Email Setup Guide for SSABIRoad

## Current Issue
Welcome emails are not being sent to new users because Resend's test domain (`onboarding@resend.dev`) has limitations.

## Solution Options

### Option 1: Add a Verified Domain (Recommended for Production)
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Add your domain (e.g., `ssabiroad.com` or `pic2nav.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)
6. Update the email sender in `lib/email.ts`:
   ```typescript
   from: 'SSABIRoad <noreply@yourdomain.com>',
   ```

### Option 2: Use Test Mode (For Development)
With `onboarding@resend.dev`, emails will only be sent to:
- Email addresses you've verified in your Resend account
- Your Resend account email

To verify test emails:
1. Go to [Resend Dashboard](https://resend.com/settings)
2. Add test email addresses under "Verified Emails"
3. Confirm the verification email sent to those addresses

### Option 3: Use Alternative Email Service
If you prefer another service, you can modify `lib/email.ts` to use:
- SendGrid
- AWS SES
- Mailgun
- Postmark

## Testing the Email Function

You can test the email function by creating a test API endpoint:

```typescript
// app/api/test-email/route.ts
import { sendWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sendWelcomeEmail("test@example.com", "Test User");
  return NextResponse.json(result);
}
```

## Current Configuration
- Email Service: Resend
- API Key: Set in `.env.local` as `RESEND_API_KEY`
- Sender: `SSABIRoad <onboarding@resend.dev>`
- Email Template: Located in `lib/email.ts`

## Troubleshooting

### Check if API key is valid:
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-verified-email@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Common Errors:
- **403 Forbidden**: Domain not verified or email not in allowed list
- **422 Unprocessable**: Invalid email format or missing required fields
- **401 Unauthorized**: Invalid API key

## Next Steps
1. Verify your domain with Resend (recommended)
2. Or add test email addresses to Resend's verified list
3. Monitor logs in production to ensure emails are being sent
4. Consider adding email queue for better reliability
