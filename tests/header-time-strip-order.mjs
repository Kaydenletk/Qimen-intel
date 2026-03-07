import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

const hourIdx = serverSource.indexOf("label: getSectionLabel('Giờ')");
const dayIdx = serverSource.indexOf("label: getSectionLabel('Ngày')");
const monthIdx = serverSource.indexOf("label: getSectionLabel('Tháng')");
const yearIdx = serverSource.indexOf("label: getSectionLabel('Năm')");

assert.notEqual(hourIdx, -1, 'Header strip phải có cột Giờ');
assert.notEqual(dayIdx, -1, 'Header strip phải có cột Ngày');
assert.notEqual(monthIdx, -1, 'Header strip phải có cột Tháng');
assert.notEqual(yearIdx, -1, 'Header strip phải có cột Năm');
assert.ok(hourIdx < dayIdx && dayIdx < monthIdx && monthIdx < yearIdx, 'Header strip phải giữ đúng thứ tự Giờ | Ngày | Tháng | Năm');

console.log('ASSERTIONS: OK');
