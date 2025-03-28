import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../client/public");
const iconsDir = path.join(publicDir, "icons");

const iconSizes = [
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon.ico", size: 32 },
];

async function generateIcons() {
  try {
    // Move the source SVG to icons directory first
    await sharp(path.join(publicDir, "icon.svg")).toFile(
      path.join(iconsDir, "icon.svg")
    );
    console.log("Moved icon.svg to icons directory");

    const svgBuffer = await sharp(path.join(iconsDir, "icon.svg")).toBuffer();

    for (const { name, size } of iconSizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .toFile(path.join(iconsDir, name));
      console.log(`Generated ${name}`);
    }

    // Create masked icon (monochrome version)
    await sharp(svgBuffer)
      .resize(512, 512)
      .modulate({ brightness: 0, saturation: 0 })
      .toFile(path.join(iconsDir, "masked-icon.svg"));
    console.log("Generated masked-icon.svg");

    console.log("All icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
