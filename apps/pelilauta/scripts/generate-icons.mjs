#!/usr/bin/env node
/**
 * Icon Generation Script
 *
 * This script scans the /public/icons/ directory and generates a static JSON file
 * containing all available icon names. This eliminates the need for runtime API calls
 * and enables build-time optimization of the NounSelect component.
 */

import fs from 'node:fs';
import path from 'node:path';

async function generateIconsList() {
  try {
    const iconsDir = path.join(process.cwd(), 'public', 'icons');

    // Check if icons directory exists
    if (!fs.existsSync(iconsDir)) {
      console.error(`❌ Icons directory not found: ${iconsDir}`);
      process.exit(1);
    }

    // Read all files from the icons directory
    const files = await fs.promises.readdir(iconsDir);

    // Filter to only SVG files and exclude design files
    const icons = files
      .filter((file) => {
        const lowerFile = file.toLowerCase();
        return (
          lowerFile.endsWith('.svg') &&
          !lowerFile.includes('.afdesign') &&
          !lowerFile.includes('.ai')
        );
      })
      .map((file) => file.replace('.svg', ''))
      .sort();

    // Generate the data structure
    const iconData = {
      icons,
      generatedAt: new Date().toISOString(),
      totalCount: icons.length,
    };

    // Write to the data directory
    const outputPath = path.join(
      process.cwd(),
      'src',
      'data',
      'available-icons.json',
    );
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(iconData, null, 2),
      'utf8',
    );

    console.log(`✅ Generated ${icons.length} icons to ${outputPath}`);
    console.log(
      `📊 Available icons: ${icons.slice(0, 5).join(', ')}${icons.length > 5 ? '...' : ''}`,
    );
  } catch (error) {
    console.error('❌ Error generating icons list:', error);
    process.exit(1);
  }
}

// Run the script if called directly
generateIconsList();
