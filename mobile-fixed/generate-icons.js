const fs = require('fs');

// Create a simple 1024x1024 icon using Canvas-like approach
// This creates a base64 PNG with a camera icon design

const createIcon = (size) => {
  // Simple PNG header for a solid color icon
  const canvas = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#6366f1" rx="${size * 0.2}"/>
  <g transform="translate(${size * 0.2}, ${size * 0.3})">
    <rect width="${size * 0.6}" height="${size * 0.4}" fill="white" rx="${size * 0.05}"/>
    <circle cx="${size * 0.35}" cy="${size * 0.2}" r="${size * 0.12}" fill="#6366f1"/>
    <circle cx="${size * 0.35}" cy="${size * 0.2}" r="${size * 0.07}" fill="white"/>
    <circle cx="${size * 0.35}" cy="${size * 0.2}" r="${size * 0.03}" fill="#6366f1"/>
    <circle cx="${size * 0.5}" cy="${size * 0.15}" r="${size * 0.08}" fill="#ef4444"/>
    <circle cx="${size * 0.5}" cy="${size * 0.15}" r="${size * 0.03}" fill="white"/>
  </g>
</svg>`;
  
  return canvas;
};

// Generate different sizes
const sizes = [1024, 512, 192, 144, 96, 72, 48];

sizes.forEach(size => {
  const svg = createIcon(size);
  fs.writeFileSync(`./assets/icon-${size}.svg`, svg);
});

console.log('Icon SVGs generated for all sizes');