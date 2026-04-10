const fs = require('fs');
const path = require('path');

const mediaRoot = path.join(__dirname, '..', 'public', 'media');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

const years = fs.readdirSync(mediaRoot)
  .filter((d) => /^\d{4}$/.test(d))
  .sort()
  .reverse();

const result = years.map((year) => {
  const yearDir = path.join(mediaRoot, year);
  const months = fs.readdirSync(yearDir).filter((d) => /^\d{2}$/.test(d)).sort();
  const images = [];
  for (const month of months) {
    const monthDir = path.join(yearDir, month);
    const files = fs.readdirSync(monthDir).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
    for (const file of files) {
      images.push(`/media/${year}/${month}/${file}`);
    }
  }
  return { year, images };
});

const out = path.join(__dirname, '..', 'public', 'gallery-manifest.json');
fs.writeFileSync(out, JSON.stringify(result));
console.log(`Gallery manifest written: ${result.reduce((n, y) => n + y.images.length, 0)} images across ${result.length} years`);
