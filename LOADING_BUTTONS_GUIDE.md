# Loading Buttons Implementation Guide

## Overview
All navigation buttons now show loading animations to provide user feedback during page transitions.

## Usage

### LoadingButton Component

```tsx
import { LoadingButton } from '@/components/ui/loading-button'

// For navigation
<LoadingButton href="/dashboard">Go to Dashboard</LoadingButton>

// For async actions
<LoadingButton onClick={async () => await saveData()}>
  Save Changes
</LoadingButton>

// With variants
<LoadingButton variant="outline" href="/profile">
  View Profile
</LoadingButton>
```

## Features

- ✅ Automatic spinner animation
- ✅ Disabled state during loading
- ✅ Works with Next.js router
- ✅ Supports all Button props
- ✅ Async onClick support

## Migration

Replace existing buttons:

```tsx
// Before
<Button asChild>
  <Link href="/page">Click Me</Link>
</Button>

// After
<LoadingButton href="/page">Click Me</LoadingButton>
```

## Updated Pages

- `/app/collections/page.tsx` - All navigation buttons
- `/app/history/page.tsx` - Back to home button
- `/app/blog/new-features-2025/page.tsx` - CTA buttons

## Next Steps

Apply LoadingButton to:
- Blog post navigation
- Dashboard actions
- Form submissions
- Authentication flows
- Location detail pages
