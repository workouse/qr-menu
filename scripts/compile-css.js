const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function compile(config, outputTs, exportName) {
  const scriptsDir = __dirname;
  const tempCss = path.join(scriptsDir, `temp-${exportName}.css`);
  
  // Write basic tailwind directives to temp
  fs.writeFileSync(tempCss, '@tailwind base;\n@tailwind components;\n@tailwind utilities;');
  
  try {
    // Run tailwind CSS compiler
    const css = execSync(`npx tailwindcss -c "${config}" -i "${tempCss}" --minify`, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }).toString().trim();
    
    // Write wrapper TS file
    fs.writeFileSync(outputTs, `export const ${exportName} = ${JSON.stringify(css)};\n`);
    console.log(`Successfully compiled Tailwind CSS for ${exportName} to ${outputTs}`);
  } catch (err) {
    console.error(`Error compiling CSS for ${exportName}:`, err.message);
    if (err.stdout) console.error('Stdout:', err.stdout.toString());
    if (err.stderr) console.error('Stderr:', err.stderr.toString());
    process.exit(1);
  } finally {
    if (fs.existsSync(tempCss)) {
      fs.unlinkSync(tempCss);
    }
  }
}

const root = path.resolve(__dirname, '..');
compile(
  path.join(root, 'tailwind.config.landing.js'),
  path.join(root, 'apps/customer-menu/src/landing.css.ts'),
  'LANDING_CSS'
);
compile(
  path.join(root, 'tailwind.config.menu.js'),
  path.join(root, 'apps/dashboard/src/menu.css.ts'),
  'MENU_CSS'
);
