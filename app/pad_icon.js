const Jimp = require("jimp");
const path = require("path");

async function main() {
  const iconPath = path.join(__dirname, "assets", "logo.png");
  const outputPath = path.join(__dirname, "assets", "adaptive-logo.png");

  try {
    // Attempt jimp v1 API
    const image = await Jimp.Jimp.read(iconPath);
    image.resize({ w: 600, h: 600 });
    
    const background = new Jimp.Jimp({ width: 1024, height: 1024, color: 0x00000000 });
    background.composite(image, 212, 212);
    
    await background.write(outputPath);
    console.log("Adaptive logo created successfully with Jimp v1!");
    return;
  } catch (e) {
    console.log("Jimp v1 API failed, trying v0 API...", e.message);
  }

  try {
    // Attempt jimp v0 API
    const image = await Jimp.read(iconPath);
    image.resize(600, 600);
    
    new Jimp(1024, 1024, 0x00000000, (err, background) => {
      if (err) throw err;
      background.composite(image, 212, 212);
      background.write(outputPath, () => {
        console.log("Adaptive logo created successfully with Jimp v0!");
      });
    });
  } catch (err) {
    console.error("Failed to generate adaptive logo", err);
  }
}

main();
