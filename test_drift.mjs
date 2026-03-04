import { getDayPillar } from './src/core/stems.js';
import { getSolarTermInfo } from './src/core/calendar.js';

const date = new Date(2026, 2, 3, 23, 17); // Mar 3 2026 23:17
console.log("Day pillar for 23:17:", getDayPillar(date));

const date2 = new Date(2026, 2, 3, 15, 0); // Mar 3 2026 15:00
console.log("Day pillar for 15:00:", getDayPillar(date2));
