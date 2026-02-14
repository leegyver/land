
import { calculateSaju } from './client/src/lib/saju';

// Test Cases
// 1. Hwagae: Day Branch In/O/Sul (e.g. In) -> Sul in other branch
// Date: 2022-02-18 (Year: In, Month: In, Day: In?)
// Let's use a known date.
// 2024-04-10 (Gap-Jin year, Mu-Jin month, Gap-Jin day)
// Jin (Dragon) is in Sin-Ja-Jin triplet -> Hwagae is Jin.
// So this date should have Hwagae.

const testDate1 = new Date('2024-04-10T12:00:00');
const result1 = calculateSaju(testDate1);
console.log('Test 1 (2024-04-10):');
console.log('Day Stem:', result1.day.heavenlyStem);
console.log('Day Branch:', result1.day.earthlyBranch);
console.log('Spirits:', result1.spirits);

// 2. Hongyeom: Day Stem Gap + Branch O
// 2014-01-31 is Gap-O day (Lunar New Year is usually late Jan/Feb)
// Let's look for a Gap-O day.
// 2024 is Gap-Jin.
// Cycle is 60 days.
// Let's try to simulate or just check the logic function if accessible.
// Since we import calculateSaju which uses internal logic, we trust the date-to-pillar conversion (manseryeok).
// We need a date that results in Gap-O day.
// 2014-02-04 (Li Chun) -> Gap-O year.
// Any day with Gap-O?
// Let's try 2023-07-06 (random guess, verify later if needed) -> actually hard to guess.
// Instead, let's rely on the fact that if the logic is correct, it will show up for SOME date.

// Let's check a date that definitely has Hongyeom check:
// Gap-O day.
// 2024-01-01 was Gap-Ja.
// Gap-Ja -> ... -> Gap-O is +30 days? No, +10 is Gap-Sul, +20 Gap-Sin, +30 Gap-O.
// 2024-01-01 + 30 days = 2024-01-31.
const testDate2 = new Date('2024-01-31T12:00:00');
const result2 = calculateSaju(testDate2);
console.log('\nTest 2 (2024-01-31 - Expected Gap-O day?):');
console.log('Day Stem:', result2.day.heavenlyStem);
console.log('Day Branch:', result2.day.earthlyBranch);
console.log('Spirits:', result2.spirits);
