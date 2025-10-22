# Responsive Design Quick Reference

## Common Responsive Patterns

### Spacing
```tsx
// Mobile-first spacing
className="p-3 sm:p-4 md:p-6 lg:p-8"
className="gap-2 sm:gap-3 md:gap-4 lg:gap-6"
className="mb-4 sm:mb-6 md:mb-8"
```

### Typography
```tsx
// Responsive text sizes
className="text-sm sm:text-base md:text-lg lg:text-xl"
className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
```

### Layout Grids
```tsx
// Responsive columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
className="grid grid-cols-2 lg:grid-cols-4"
```

### Flexbox
```tsx
// Stack on mobile, row on desktop
className="flex flex-col sm:flex-row"
className="flex flex-col lg:flex-row items-center gap-4"
```

### Visibility
```tsx
// Hide on mobile, show on desktop
className="hidden sm:block"
className="hidden lg:flex"

// Show on mobile, hide on desktop
className="block sm:hidden"
className="sm:hidden"
```

### Buttons
```tsx
// Responsive button sizes
<Button size="sm" className="text-xs sm:text-sm">
  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
  <span className="hidden sm:inline">Full Text</span>
  <span className="sm:hidden">Short</span>
</Button>
```

### Images
```tsx
// Responsive images with Next.js
<Image
  src="/image.jpg"
  alt="Description"
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority // for above-the-fold images
/>
```

### Containers
```tsx
// Responsive container padding
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

### Cards
```tsx
// Responsive card
<div className="rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8">
  <h3 className="text-lg sm:text-xl md:text-2xl">Title</h3>
  <p className="text-sm sm:text-base">Content</p>
</div>
```

### Navigation
```tsx
// Mobile menu
<nav className="flex items-center justify-between">
  <div className="flex lg:hidden">
    {/* Mobile menu button */}
  </div>
  <div className="hidden lg:flex gap-4">
    {/* Desktop menu items */}
  </div>
</nav>
```

## Breakpoint Reference

| Breakpoint | Min Width | Typical Device |
|------------|-----------|----------------|
| xs | 475px | Large phones |
| sm | 640px | Tablets (portrait) |
| md | 768px | Tablets (landscape) |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

## Touch Target Sizes

Minimum touch target sizes:
- Buttons: 44x44px (iOS) / 48x48px (Android)
- Links: 44x44px minimum
- Form inputs: 44px height minimum

```tsx
// Touch-friendly button
<button className="min-h-[44px] min-w-[44px] p-3">
  Click me
</button>
```

## Common Responsive Hooks

```tsx
import { useIsMobile, useResponsive } from '@/hooks/use-mobile'

function MyComponent() {
  const isMobile = useIsMobile()
  const { isTablet, isDesktop, isTouch } = useResponsive()
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  )
}
```

## Performance Tips

1. **Use responsive images**
   ```tsx
   sizes="(max-width: 768px) 100vw, 50vw"
   ```

2. **Lazy load below-the-fold content**
   ```tsx
   loading="lazy"
   ```

3. **Minimize layout shifts**
   ```tsx
   className="aspect-video" // Reserve space
   ```

4. **Use CSS transforms for animations**
   ```tsx
   className="transition-transform hover:scale-105"
   ```

## Testing Checklist

- [ ] Test on iPhone SE (smallest modern phone)
- [ ] Test on iPad (tablet view)
- [ ] Test on desktop (1920px)
- [ ] Test landscape orientation
- [ ] Test with slow 3G network
- [ ] Test touch interactions
- [ ] Test keyboard navigation
- [ ] Verify text is readable (minimum 16px)
- [ ] Check tap targets are adequate
- [ ] Verify no horizontal scroll

## Common Issues & Solutions

### Issue: Text too small on mobile
```tsx
// ❌ Bad
className="text-xs"

// ✅ Good
className="text-sm sm:text-base"
```

### Issue: Buttons too small to tap
```tsx
// ❌ Bad
<button className="p-1">

// ✅ Good
<button className="p-3 min-h-[44px]">
```

### Issue: Images not responsive
```tsx
// ❌ Bad
<img src="/image.jpg" width="800" height="600" />

// ✅ Good
<Image 
  src="/image.jpg" 
  fill 
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Issue: Layout breaks on small screens
```tsx
// ❌ Bad
className="flex gap-8"

// ✅ Good
className="flex flex-col sm:flex-row gap-4 sm:gap-8"
```

## Quick Commands

```bash
# Test on different viewports (Chrome DevTools)
# Mobile: 375x667 (iPhone SE)
# Tablet: 768x1024 (iPad)
# Desktop: 1920x1080

# Run development server
npm run dev

# Build for production
npm run build

# Check bundle size
npm run build -- --analyze
```
