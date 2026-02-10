
import { calculateSaju } from './src/lib/saju';

// Test Case: 2000-01-01 12:00 (Dragon Year, etc.)
// Note: Month/Day will be standard Gregorian for input.
const testDate = new Date('2000-01-01T12:00:00');
const testTime = '12:00';

console.log(`Testing Saju Logic for: ${testDate.toISOString()} ${testTime}`);

try {
    const result = calculateSaju(testDate, testTime);

    console.log('--- Four Pillars ---');
    console.log('Year:', result.year.heavenlyStem, result.year.earthlyBranch);
    console.log('Month:', result.month.heavenlyStem, result.month.earthlyBranch);
    console.log('Day:', result.day.heavenlyStem, result.day.earthlyBranch);
    console.log('Time:', result.timeStem, result.timeBranch); // Using simplified keys from my interface

    console.log('\n--- Analysis ---');
    console.log('Dominant Element:', result.dominantElement);
    console.log('Lacking Element:', result.lackingElement);

    console.log('\n--- Ten Gods (Shipseong) ---');
    console.log(JSON.stringify(result.tenGods, null, 2));

    console.log('\n--- Spirits (Sinsal) ---');
    console.log(result.spirits);

    console.log('\n--- 12 Stages ---');
    console.log(JSON.stringify(result.twelveStages, null, 2));

} catch (error) {
    console.error('Error executing Saju calculation:', error);
}
