import { describe, it, expect } from 'vitest';
import { defaultRetriever } from '../lib/bm25';

describe('BM25 Retrieval Engine', () => {
  it('should rank diarrhea and ORS protocol highest for diarrhea query', () => {
    const results = defaultRetriever.search("How to prepare ORS packet for child diarrhea dehydration?", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc.id).toBe('PROT-DIARRHEA-01');
    expect(results[0].score).toBeGreaterThan(1.5);
  });

  it('should rank immunization protocol highest for vaccines query', () => {
    const results = defaultRetriever.search("When should Pentavalent and rotavirus vaccines be given to infant?", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc.id).toBe('PROT-IMM-01');
  });

  it('should rank hypertension protocol highest for high blood pressure salt query', () => {
    const results = defaultRetriever.search("blood pressure salt lifestyle advice", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc.id).toBe('PROT-NCD-01');
  });
});
