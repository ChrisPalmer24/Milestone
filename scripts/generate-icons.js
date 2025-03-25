import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Define required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Our app icon as an SVG string with placeholders for width and height
const svgTemplate = `<svg width="{width}" height="{height}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#3B82F6"/>
  <circle cx="256" cy="256" r="180" fill="white"/>
  <path d="M256 96C167.634 96 96 167.634 96 256C96 344.366 167.634 416 256 416C344.366 416 416 344.366 416 256C416 167.634 344.366 96 256 96ZM256 376C189.766 376 136 322.234 136 256C136 189.766 189.766 136 256 136C322.234 136 376 189.766 376 256C376 322.234 322.234 376 256 376Z" fill="#3B82F6"/>
  <path d="M328 216L256 288L184 216" stroke="#3B82F6" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M256 352V288" stroke="#3B82F6" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Function to convert SVG to PNG using canvas (in a browser environment)
// For Node.js, we would typically use a library like sharp or svgexport
// In this simplified example, we'll just save the SVGs and later convert them
function generateIconSVG(size) {
  const svg = svgTemplate
    .replace('{width}', size)
    .replace('{height}', size);
  
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated: ${svgPath}`);
}

// Generate SVG icons for all sizes
sizes.forEach(size => {
  generateIconSVG(size);
});

console.log('Icon generation complete!');
console.log('Note: For a production app, you would need to convert these SVGs to PNG files.');
console.log('You can use tools like sharp, svgexport, or Inkscape to convert them.');