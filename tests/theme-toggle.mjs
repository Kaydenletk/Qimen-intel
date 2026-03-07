import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

assert.match(
  serverSource,
  /<title>Kymon · QMDJ Engine<\/title>\s*<script>[\s\S]*const THEME_STORAGE_KEY = 'kymon_theme';[\s\S]*const autoTheme = \(hour >= 19 \|\| hour < 7\) \? 'dark' : 'light';[\s\S]*document\.documentElement\.dataset\.theme = theme;[\s\S]*document\.documentElement\.style\.colorScheme = theme;[\s\S]*<\/script>\s*<link rel="icon"/,
  'Theme phải được bootstrap sớm trong head để tránh flash sai mode'
);

assert.match(serverSource, /html\[data-theme="dark"\] \{/, 'CSS phải dùng html[data-theme="dark"] làm hook chủ đạo');
assert.match(serverSource, /<button type="button" class="theme-toggle" id="themeToggle"/, 'Header phải có nút toggle theme');
assert.match(serverSource, /const themeToggleEl = document\.getElementById\('themeToggle'\);/, 'Frontend phải lấy ref nút toggle');
assert.match(serverSource, /function applyTheme\(theme, \{ persist = false \} = \{\}\)/, 'Phải có helper applyTheme thống nhất');
assert.match(serverSource, /localStorage\.setItem\(THEME_STORAGE_KEY, resolvedTheme\);/, 'Manual theme choice phải được lưu vào localStorage');
assert.match(serverSource, /themeToggleEl\.addEventListener\('click', \(\) => \{[\s\S]*applyTheme\(nextTheme, \{ persist: true \}\);[\s\S]*\}\);/, 'Nút toggle phải đổi theme và lưu preference');
assert.match(serverSource, /\.theme-toggle \{/, 'Theme toggle phải có style riêng');
assert.match(serverSource, /\.theme-icon-sun/, 'Theme toggle phải có icon mặt trời');
assert.match(serverSource, /\.theme-icon-moon/, 'Theme toggle phải có icon mặt trăng');

console.log('ASSERTIONS: OK');
