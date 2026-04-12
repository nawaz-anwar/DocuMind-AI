import { cosineSimilarity, chunkText, cleanText } from '@documind/utils';

describe('Utils', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0, 5);
    });

    it('should throw error for vectors of different lengths', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('chunkText', () => {
    it('should split text into chunks', () => {
      const text = 'word '.repeat(1000);
      const chunks = chunkText(text, 100, 10);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle small text', () => {
      const text = 'short text';
      const chunks = chunkText(text, 100, 10);
      expect(chunks.length).toBe(1);
    });
  });

  describe('cleanText', () => {
    it('should normalize whitespace', () => {
      const text = 'text   with    spaces\n\n\nmultiple lines';
      const cleaned = cleanText(text);
      expect(cleaned).toBe('text with spaces\nmultiple lines');
    });
  });
});
