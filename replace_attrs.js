const fs = require('fs');
let content = fs.readFileSync('apps/customer-menu/src/index.ts', 'utf8');

// Remove data-en="..." and data-tr="..."
content = content.replace(/\sdata-en="[^"]*"/g, '');
content = content.replace(/\sdata-tr="[^"]*"/g, '');

// Remove buildTranslationScript completely
content = content.replace(/const buildTranslationScript = \(\) => `[\s\S]*?`;/, 'const buildTranslationScript = () => ``;');
// Also remove it from where it's called (if it is)
// wait, we can just replace the buttons in buildHeaderHtml
content = content.replace(
  /<button onclick="setLanguage\('en'\)" data-lang="en" class="lang-btn([^"]*)">EN<\/button>/g,
  '<a href="?lang=en" class="lang-btn$1">EN</a>'
);
content = content.replace(
  /<button onclick="setLanguage\('tr'\)" data-lang="tr" class="lang-btn([^"]*)">TR<\/button>/g,
  '<a href="?lang=tr" class="lang-btn$1">TR</a>'
);

fs.writeFileSync('apps/customer-menu/src/index.ts', content);
