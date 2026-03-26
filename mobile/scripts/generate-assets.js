#!/usr/bin/env node
/**
 * MYKO — App Icon & Splash Screen Generator
 *
 * Generates properly sized placeholder assets for Expo builds.
 * Replace these with your actual production artwork before submitting to stores.
 *
 * Requirements:
 *   npm install -g sharp-cli
 *   OR run: npx sharp-cli ...
 *
 * Usage:
 *   node scripts/generate-assets.js
 *
 * Asset requirements:
 *   - icon.png: 1024x1024 (App Store / Play Store icon)
 *   - adaptive-icon.png: 1024x1024 (Android adaptive icon foreground)
 *   - splash.png: 1284x2778 (splash screen, iPhone 14 Pro Max size)
 *   - notification-icon.png: 96x96 (Android notification, white on transparent)
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Simple SVG-based placeholder generator (no dependencies needed)
function generateSVGIcon(size, text, bgColor, textColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.15}"/>
  <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

function generateSplashSVG(width, height, text, bgColor, textColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="${width * 0.12}" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${width * 0.04}" fill="${textColor}80" text-anchor="middle" dominant-baseline="middle">Meet by Chance. Konnect by Choice.</text>
</svg>`;
}

console.log('\\n🎨 MYKO Asset Generator\\n');
console.log('This script creates SVG placeholders in the assets/ directory.');
console.log('For production, replace these with your actual PNG artwork:\\n');
console.log('  icon.png            — 1024x1024 px (App Store icon)');
console.log('  adaptive-icon.png   — 1024x1024 px (Android adaptive icon)');
console.log('  splash.png          — 1284x2778 px (Splash screen)');
console.log('  notification-icon.png — 96x96 px  (Android notification)');
console.log('');

// Generate SVG files as reference
const iconSVG = generateSVGIcon(1024, 'M', '#0B2545', '#0EA5E9');
const splashSVG = generateSplashSVG(1284, 2778, 'MYKO', '#0B2545', '#0EA5E9');
const notifSVG = generateSVGIcon(96, 'M', 'transparent', '#FFFFFF');

fs.writeFileSync(path.join(ASSETS_DIR, 'icon-template.svg'), iconSVG);
fs.writeFileSync(path.join(ASSETS_DIR, 'splash-template.svg'), splashSVG);
fs.writeFileSync(path.join(ASSETS_DIR, 'notification-icon-template.svg'), notifSVG);

console.log('✅ SVG templates written to assets/');
console.log('');
console.log('To convert SVGs to PNGs, use one of:');
console.log('  npx sharp-cli -i assets/icon-template.svg -o assets/icon.png resize 1024 1024');
console.log('  npx sharp-cli -i assets/splash-template.svg -o assets/splash.png resize 1284 2778');
console.log('  npx sharp-cli -i assets/notification-icon-template.svg -o assets/notification-icon.png resize 96 96');
console.log('');
console.log('Or use Figma/Photoshop to create production-quality artwork.');
console.log('');
