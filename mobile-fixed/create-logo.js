// Simple script to create logo using Canvas API (for web environments)
// This creates a 1024x1024 logo with camera and location pin

const fs = require('fs');

// Create SVG logo
const logoSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="512" cy="512" r="512" fill="#6366f1"/>
  
  <!-- Camera body -->
  <rect x="256" y="384" width="384" height="256" rx="32" fill="white"/>
  
  <!-- Camera lens -->
  <circle cx="448" cy="512" r="80" fill="#6366f1"/>
  <circle cx="448" cy="512" r="48" fill="white"/>
  <circle cx="448" cy="512" r="24" fill="#6366f1"/>
  
  <!-- Location pin -->
  <path d="M576 320 C576 320 640 320 640 384 C640 448 576 512 576 512 C576 512 512 448 512 384 C512 320 576 320 576 320 Z" fill="#ef4444"/>
  <circle cx="576" cy="384" r="24" fill="white"/>
  
  <!-- Flash -->
  <rect x="544" y="416" width="32" height="16" rx="8" fill="#fbbf24"/>
  
  <!-- Viewfinder -->
  <rect x="576" y="400" width="48" height="32" rx="4" fill="#374151"/>
</svg>
`;

// Create splash screen SVG
const splashSVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1284" height="2778" fill="#0a0a0a"/>
  
  <!-- Logo container -->
  <g transform="translate(392, 1139)">
    <!-- Background circle -->
    <circle cx="250" cy="250" r="200" fill="#6366f1"/>
    
    <!-- Camera body -->
    <rect x="150" y="200" width="200" height="100" rx="16" fill="white"/>
    
    <!-- Camera lens -->
    <circle cx="225" cy="250" r="40" fill="#6366f1"/>
    <circle cx="225" cy="250" r="24" fill="white"/>
    <circle cx="225" cy="250" r="12" fill="#6366f1"/>
    
    <!-- Location pin -->
    <path d="M275 180 C275 180 315 180 315 220 C315 260 275 300 275 300 C275 300 235 260 235 220 C235 180 275 180 275 180 Z" fill="#ef4444"/>
    <circle cx="275" cy="220" r="12" fill="white"/>
    
    <!-- Flash -->
    <rect x="260" y="225" width="16" height="8" rx="4" fill="#fbbf24"/>
    
    <!-- Viewfinder -->
    <rect x="275" y="235" width="24" height="16" rx="2" fill="#374151"/>
  </g>
  
  <!-- App name -->
  <text x="642" y="1600" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="bold">Pic2Nav</text>
  <text x="642" y="1680" text-anchor="middle" fill="#a1a1aa" font-family="Arial, sans-serif" font-size="32">Photo Location Analysis</text>
</svg>
`;

// Write SVG files
fs.writeFileSync('./assets/logo.svg', logoSVG);
fs.writeFileSync('./assets/splash.svg', splashSVG);

console.log('SVG files created successfully!');