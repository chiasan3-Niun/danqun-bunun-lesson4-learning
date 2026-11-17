const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const app = read('app.js');
const readme = read('README.md');

assert.match(html, /<html\s+lang="zh-Hant"/);
assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1">/);
assert.match(html, /<a\s+class="skip-link"\s+href="#main-content">/);
assert.match(html, /<main\s+id="main-content">/);
assert.match(html, /<label\s+for="study-progress">/);
assert.match(html, /id="feedback-area"[^>]*tabindex="-1"/);

for (const token of ['--page-bg', '--surface', '--ink', '--focus-ring', '--min-touch-target']) {
  assert.match(css, new RegExp(`${token}\\s*:`), `Missing design token ${token}`);
}
assert.match(css, /button\s*\{[\s\S]*min-height:\s*var\(--min-touch-target\)/);
assert.match(css, /button\s*\{[\s\S]*min-inline-size:\s*var\(--min-touch-target\)/);
assert.match(css, /button:focus-visible\s*,/);
assert.match(css, /\.game-options\s*\{[\s\S]*flex-wrap:\s*wrap/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /@media\s*\(max-width:\s*42rem\)/);
assert.match(css, /background-attachment:\s*scroll/);
assert.match(app, /setAttribute\('aria-controls', 'game-area'\)/);
assert.match(app, /feedbackArea\.focus\(\)/);

assert.match(readme, /C:\\Users\\user\\Downloads\\網頁測試\\丹群布農語第一階第四課學習站/);
assert.match(readme, /powershell[^\n]+static-check\.ps1/);
assert.match(readme, /study-check\.ps1/);
assert.match(readme, /level-check\.cjs/);
assert.match(readme, /comprehensive-check\.cjs/);
assert.match(readme, /task-5-asset-check\.cjs/);
assert.match(readme, /task-6-final-check\.cjs/);
assert.match(readme, /1-4-1丹群簡報原始檔/);
assert.match(readme, /1-4-2丹群簡報原始檔/);
assert.match(readme, /Copyright © 2026 財團法人原住民族語言研究發展基金會 版權所有/);
assert.doesNotMatch(readme, /對應待核對/);

console.log('PASS: responsive, keyboard, accessibility, documentation, and final static contracts');
