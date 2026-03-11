import { analyze } from './src/index.js';

// August 9, 2007, 20:00 (Vietnam Time / +07:00)
// Giờ Bính Tuất (19:00 - 20:59)
const dt = new Date('2007-08-09T20:00:00+07:00');
const result = analyze(dt, 20, ['su-nghiep', 'tai-van']);
const suNghiep = result.topicResults['su-nghiep'];
const taiVan = result.topicResults['tai-van'];

console.log(`=== BÀN CỜ KYMON AI ===`);
console.log(`Năm: ${result.chart.yearPillar.stemName} ${result.chart.yearPillar.branchName}`);
console.log(`Tháng: ${result.chart.monthPillar.stemName} ${result.chart.monthPillar.branchName}`);
console.log(`Ngày: ${result.chart.dayPillar.stemName} ${result.chart.dayPillar.branchName}`);
console.log(`Giờ: ${result.chart.gioPillar.stemName} ${result.chart.gioPillar.branchName}`);
console.log(`Tiết Khí: ${result.chart.solarTerm.name}, Cục: ${result.chart.cucSo} ${result.chart.isDuong ? 'Dương Độn' : 'Âm Độn'}`);

console.log(`Trực Phù: ${result.chart.leadStar} (Palace: ${result.chart.trucPhuPalace})`);
console.log(`Trực Sử: ${result.chart.leadDoor} (Palace: ${result.chart.trucSuPalace})`);

for(let i=1; i<=9; i++) {
   if(i!==5) console.log(`Cung ${i}: Môn=${result.chart.palaces[i].mon?.name}, Tinh=${result.chart.palaces[i].star?.name}, Thần=${result.chart.palaces[i].than?.name}, Can=${result.chart.palaces[i].can?.name}`);
}

console.log(`\n=== KẾT QUẢ AI LUẬN GIẢI (SỰ NGHIỆP) ===`);
console.log(`Cung Dụng Thần: ${suNghiep.usefulGodPalace} (${suNghiep.usefulGodPalaceName})`);
console.log(`Điểm số: ${suNghiep.score}`);
console.log(`Lời Khuyên: ${suNghiep.actionAdvice}`);

console.log(`\n=== KẾT QUẢ AI LUẬN GIẢI (TÀI VẬN) ===`);
console.log(`Cung Dụng Thần: ${taiVan.usefulGodPalace} (${taiVan.usefulGodPalaceName})`);
console.log(`Điểm số: ${taiVan.score}`);
console.log(`Lời Khuyên: ${taiVan.actionAdvice}`);
