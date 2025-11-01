const fs = require('fs');
const path = require('path');

const fontMap = {
  'fontWeight: \'700\'': 'fontFamily: \'LeagueSpartan_700Bold\'',
  'fontWeight: \'600\'': 'fontFamily: \'LeagueSpartan_600SemiBold\'',
  'fontWeight: \'500\'': 'fontFamily: \'LeagueSpartan_600SemiBold\'',
  'fontWeight: \'400\'': 'fontFamily: \'LeagueSpartan_400Regular\'',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [oldFont, newFont] of Object.entries(fontMap)) {
    if (content.includes(oldFont)) {
      content = content.replace(new RegExp(oldFont, 'g'), newFont);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('Applying League Spartan fonts...\n');
walkDir('./app');
walkDir('./components');
console.log('\n✓ Done!');
