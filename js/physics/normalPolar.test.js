import { describe, it, expect, beforeEach } from 'vitest';
import { BrownianMotion } from './brownianMotion.js';

describe('BrownianMotion', () => {
  describe('normalPolar', () => {
    let brownianMotion;

    beforeEach(() => {
      brownianMotion = new BrownianMotion();
    });

    it('should return an array of two numbers', () => {
      const result = brownianMotion.normalPolar();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(typeof result[0]).toBe('number');
      expect(typeof result[1]).toBe('number');
    });

    it('should return finite numbers', () => {
      const result = brownianMotion.normalPolar();
      
      expect(Number.isFinite(result[0])).toBe(true);
      expect(Number.isFinite(result[1])).toBe(true);
    });

    it('should respect the mean parameter', () => {
      const mean = 5;
      const sd = 1;
      const samples = 10000;
      let sum = 0;

      // Generate many samples and calculate average
      for (let i = 0; i < samples; i++) {
        const [x, y] = brownianMotion.normalPolar(mean, sd);
        sum += x + y;
      }

      const average = sum / (samples * 2);
      
      // The average should be close to the specified mean (within 0.1 for large sample size)
      expect(average).toBeCloseTo(mean, 1);
    });
    it('should respect the mean parameter', () => {
      const mean = 5;
      const sd = 1;
      const samples = 100000;
      let sum = 0; 

      // Generate many samples and calculate average
      for (let i = 0; i < samples; i++) {
        const [x, y] = brownianMotion.normalPolar(mean, sd);
        sum += x + y;
      }

      const average = sum / (samples * 2);
      
      // The average should be close to the specified mean (within 0.1 for large sample size)
      expect(average).toBeCloseTo(mean, 2);
    });

    it('should respect the standard deviation parameter', () => {
      const mean = 0;
      const sd = 2;
      const samples = 10000;
      let sumSquared = 0;

      // Generate many samples and calculate variance
      for (let i = 0; i < samples; i++) {
        const [x, y] = brownianMotion.normalPolar(mean, sd);
        sumSquared += x * x + y * y;
      }

      const variance = sumSquared / (samples * 2);
      const calculatedSD = Math.sqrt(variance);
      
      // The calculated standard deviation should be close to the specified one
      expect(calculatedSD).toBeCloseTo(sd, 1);
    });

    it('should respect the standard deviation parameter', () => {
      const mean = 0;
      const sd = 2;
      const samples = 100000;
      let sumSquared = 0;

      // Generate many samples and calculate variance
      for (let i = 0; i < samples; i++) {
        const [x, y] = brownianMotion.normalPolar(mean, sd);
        sumSquared += x * x + y * y;
      }

      const variance = sumSquared / (samples * 2);
      const calculatedSD = Math.sqrt(variance);
      
      // The calculated standard deviation should be close to the specified one
      expect(calculatedSD).toBeCloseTo(sd, 2);
    });

    it('should use default parameters when none provided', () => {
      const result = brownianMotion.normalPolar();
      
      // With default mean=0 and sd=1, values should typically be within reasonable range
      expect(result[0]).toBeGreaterThan(-5);
      expect(result[0]).toBeLessThan(5);
      expect(result[1]).toBeGreaterThan(-5);
      expect(result[1]).toBeLessThan(5);
    });

    it('should generate different values on subsequent calls', () => {
      const result1 = brownianMotion.normalPolar();
      const result2 = brownianMotion.normalPolar();
      
      // It's extremely unlikely (but not impossible) for two calls to return identical values
      expect(result1[0] !== result2[0] || result1[1] !== result2[1]).toBe(true);
    });

    it('should handle zero standard deviation', () => {
      const mean = 3;
      const sd = 0;
      const result = brownianMotion.normalPolar(mean, sd);
      
      // With zero standard deviation, both values should equal the mean
      expect(result[0]).toBe(mean);
      expect(result[1]).toBe(mean);
    }); 

    it('should handle negative mean', () => {
      const mean = -2;
      const sd = 1;
      const result = brownianMotion.normalPolar(mean, sd);
      
      expect(typeof result[0]).toBe('number');
      expect(typeof result[1]).toBe('number');
      expect(Number.isFinite(result[0])).toBe(true);
      expect(Number.isFinite(result[1])).toBe(true);
    });
  });
});