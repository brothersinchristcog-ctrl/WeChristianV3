const { Jimp, intToRGBA, rgbaToInt } = require('jimp');
const path = require('path');
const fs = require('fs');

async function generateAdaptiveIcon() {
  const assetsDir = path.join(__dirname, 'assets');
  const originalPath = path.join(assetsDir, 'logo.png');
  const backupPath = path.join(assetsDir, 'logo_original.png');
  
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log('Backed up original logo.png to logo_original.png');
  }

  const original = await Jimp.read(originalPath);
  const w = original.bitmap.width; // 1254
  const h = original.bitmap.height;

  // 1. Create smooth ambient background
  const bg = original.clone();
  bg.resize({ w: 64, h: 64 });
  bg.resize({ w, h });

  // 2. Prepare the scaled logo (scale = 0.76: decreased just enough for perfect padding)
  const scale = 0.76;
  const newW = Math.round(w * scale);
  const newH = Math.round(h * scale);
  const foreground = original.clone();
  foreground.resize({ w: newW, h: newH });

  // 3. Feather the outer boundary of foreground (soft fade over 50px)
  const feather = 50;
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const distFromLeft = x;
      const distFromRight = newW - 1 - x;
      const distFromTop = y;
      const distFromBottom = newH - 1 - y;
      const minDist = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);

      if (minDist < feather) {
        const alphaFactor = minDist / feather;
        const color = intToRGBA(foreground.getPixelColor(x, y));
        color.a = Math.round(color.a * alphaFactor);
        foreground.setPixelColor(rgbaToInt(color.r, color.g, color.b, color.a), x, y);
      }
    }
  }

  // 4. Optical centering
  const offsetX = Math.round((w - newW) / 2);
  const offsetY = Math.round((h - newH) / 2) - 12;

  bg.composite(foreground, offsetX, offsetY);

  // Write to adaptive-logo.png
  const adaptiveLogoPath = path.join(assetsDir, 'adaptive-logo.png');
  await bg.write(adaptiveLogoPath);
  console.log('Updated assets/adaptive-logo.png');

  // Also write to logo.png so standard/legacy icon and iOS icon also have this perfect padding
  await bg.write(originalPath);
  console.log('Updated assets/logo.png');

  // 5. Update Android mipmap icons using withAndroidIcons
  const { setIconAsync } = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');
  const projectRoot = __dirname;
  console.log('Regenerating Android mipmaps...');
  await setIconAsync(projectRoot, {
    icon: './assets/adaptive-logo.png',
    backgroundColor: '#000000',
    isAdaptive: true
  });
  console.log('Android mipmaps regenerated successfully!');
}

generateAdaptiveIcon().catch(console.error);
