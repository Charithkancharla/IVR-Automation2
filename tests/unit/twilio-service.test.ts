import { formatPhoneNumber, estimateCallCost } from '../../src/services/twilio';

describe('Twilio Service', () => {
  describe('formatPhoneNumber', () => {
    it('should format a US phone number correctly', () => {
      const phone = '1234567890';
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('+11234567890');
    });

    it('should handle phone numbers with special characters', () => {
      const phone = '(123) 456-7890';
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('+11234567890');
    });

    it('should preserve existing country codes', () => {
      const phone = '+441234567890';
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('+441234567890');
    });

    it('should handle international numbers without +', () => {
      const phone = '441234567890';
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('+441234567890');
    });
  });

  describe('estimateCallCost', () => {
    it('should calculate cost for a 1-minute call', () => {
      const cost = estimateCallCost(60);
      // Expected: (0.013 + 0.0025 + 0.05) * 1 = 0.0655
      expect(cost).toBeCloseTo(0.0655, 4);
    });

    it('should calculate cost for a 5-minute call', () => {
      const cost = estimateCallCost(300);
      // Expected: (0.013 + 0.0025 + 0.05) * 5 = 0.3275
      expect(cost).toBeCloseTo(0.3275, 4);
    });

    it('should round up partial minutes', () => {
      const cost = estimateCallCost(75); // 1.25 minutes -> 2 minutes
      // Expected: (0.013 + 0.0025 + 0.05) * 2 = 0.131
      expect(cost).toBeCloseTo(0.131, 4);
    });
  });
});