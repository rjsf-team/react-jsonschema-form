import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const srcDir = './src/css';
const distDir = './dist/';

// Ensure dist directory exists
fs.mkdirSync(distDir, { recursive: true });

fs.readdirSync(srcDir).forEach((file) => {
  if (path.extname(file) === '.css') {
    const srcFile = path.join(srcDir, file);
    const distFile = path.join(distDir, file); // Keep the same filename
    try {
      // Add --content flag to explicitly process all content files
      execSync(
        `npx tailwindcss -i ${srcFile} -o ${distFile} --minify --content="./src/**/*.{js,jsx,ts,tsx},../playground/src/**/*.{js,jsx,ts,tsx}"`,
        {
          stdio: 'ignore',
        },
      );
    } catch (error) {
      console.error(`Error building ${srcFile}:`, error);
      process.exit(1); // Exit with error code if any file fails
    }
  }
});
