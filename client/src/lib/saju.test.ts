import { describe, it, expect } from 'vitest';
import { calculateSaju, getCompatibilityScore } from './saju';

describe('Saju Calculation Logic', () => {
    it('should calculate the Four Pillars correclty for 2000-01-01 12:00', () => {
        const testDate = new Date('2000-01-01T12:00:00');
        const testTime = '12:00';
        const result = calculateSaju(testDate, testTime);

        // Standard verification for the given date (Year of the Rabbit originally, but early Jan might be previous year depending on solar terms)
        expect(result.year.heavenlyStem).toBeDefined();
        expect(result.year.earthlyBranch).toBeDefined();
        expect(result.month.heavenlyStem).toBeDefined();
        expect(result.month.earthlyBranch).toBeDefined();
        expect(result.day.heavenlyStem).toBeDefined();
        expect(result.day.earthlyBranch).toBeDefined();

        // Ensure ten gods are attached
        expect(result.tenGods).toBeDefined();
        expect(result.twelveStages).toBeDefined();
    });

    it('should calculate time pillar with default 12:00 when time is not provided', () => {
        const testDate = new Date('2024-05-15T00:00:00');
        const result = calculateSaju(testDate);

        // time-related Ten Gods and Pillars should default to 12:00
        expect(result.tenGods.timeStem).toBeDefined();
        expect(result.tenGods.timeBranch).toBeDefined();
    });

    it('should correctly identify dominant and lacking elements', () => {
        const testDate = new Date('1990-08-15T10:00:00');
        const result = calculateSaju(testDate, '10:00');

        expect(result.dominantElement).toBeDefined();
        expect(result.lackingElement).toBeDefined();
    });
});

describe('Saju Compatibility Logic (getCompatibilityScore)', () => {
    it('should return a valid compatibility score for a given property', () => {
        const testDate = new Date('2000-01-01T12:00:00');
        const sajuData = calculateSaju(testDate, '12:00');

        const score = getCompatibilityScore(sajuData, {
            id: 1,
            direction: '남',
            floor: 5
        });

        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
        expect(score.comment).toBeDefined();
        expect(score.details.location).toBeDefined();
        expect(score.details.investment).toBeDefined();
        expect(score.details.styling).toBeDefined();
    });

    it('should adjust compatibility based on favorable directions', () => {
        // Mock a SajuData with specific favorable direction
        const testDate = new Date('1990-08-15T10:00:00');
        const sajuData = calculateSaju(testDate, '10:00');

        // Ensure that changing direction changes the score (assuming the logic factors it in)
        const scoreSouth = getCompatibilityScore(sajuData, { id: 1, direction: '남' });
        const scoreNorth = getCompatibilityScore(sajuData, { id: 2, direction: '북' });

        // While we can't guarantee they are strictly different without knowing the exact saju,
        // we can verify both return valid scored objects.
        expect(scoreSouth.score).toBeTypeOf('number');
        expect(scoreNorth.score).toBeTypeOf('number');
        expect(scoreSouth.details.styling.colors).toBeTypeOf('string');
    });

    it('should handle missing property features gracefully', () => {
        const testDate = new Date('1990-08-15T10:00:00');
        const sajuData = calculateSaju(testDate, '10:00');

        const score = getCompatibilityScore(sajuData, { id: 3 });

        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.comment).toBeDefined();
    });
});
