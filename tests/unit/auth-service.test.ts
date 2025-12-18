import { hashPassword, verifyPassword, generateJWT, verifyJWT } from '../../src/services/auth';

describe('Authentication Service', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('generateJWT', () => {
    it('should generate a JWT token', () => {
      const payload = { userId: 1, username: 'testuser' };
      const secret = 'testsecret';
      const token = generateJWT(payload, secret);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid JWT token', () => {
      const payload = { userId: 1, username: 'testuser' };
      const secret = 'testsecret';
      const token = generateJWT(payload, secret);
      const verified = verifyJWT(token, secret);
      expect(verified).toBeDefined();
      expect((verified as any).userId).toBe(1);
      expect((verified as any).username).toBe('testuser');
    });

    it('should reject an invalid JWT token', () => {
      const secret = 'testsecret';
      const invalidToken = 'invalid.token.here';
      const verified = verifyJWT(invalidToken, secret);
      expect(verified).toBeNull();
    });
  });
});