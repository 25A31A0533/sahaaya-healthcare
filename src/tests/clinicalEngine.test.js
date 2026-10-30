import { describe, it, expect } from 'vitest';
import { askClinicalAssistant } from '../lib/clinicalEngine';
import outOfScopeQuestions from '../data/out_of_scope.json';

describe('Clinical Engine Pipeline & Refusal Guardrails', () => {
  it('must safely refuse 100% of out-of-scope, prescription, dosage and non-clinical questions (15/15)', async () => {
    let refusedCount = 0;
    const failures = [];

    for (const item of outOfScopeQuestions) {
      const response = await askClinicalAssistant(item.question);
      if (response.type === 'refusal') {
        refusedCount++;
      } else {
        failures.push({ id: item.id, question: item.question, actualType: response.type });
      }
    }

    if (failures.length > 0) {
      console.error('Failed refusal questions:', failures);
    }

    expect(refusedCount).toBe(15);
    expect(failures).toHaveLength(0);
  });

  it('must cleanly resolve all suggested question chips with valid citations and zero false alarms', async () => {
    const suggestedChips = [
      "When should pregnant woman complete ANC checkups and visits?",
      "How to assess dehydration and give ORS and Zinc for diarrhea?",
      "What is dietary lifestyle advice for high blood pressure and salt?",
      "Which vaccines are due at 10 weeks of age for an infant?"
    ];

    for (const query of suggestedChips) {
      const response = await askClinicalAssistant(query);
      expect(response.type, `Chip failed on query: "${query}"`).toBe('answer');
      expect(response.citation).toMatch(/(Section|విభాగం|\d+\.\d+)/i);
      expect(response.text.length).toBeGreaterThan(30);
    }
  });

  it('must trigger immediate emergency on the newborn unable to suck chip', async () => {
    const dangerChip = "Newborn baby is unable to suck and not feeding breastmilk";
    const response = await askClinicalAssistant(dangerChip);
    expect(response.type).toBe('danger');
    expect(response.immediateAction).toBeDefined();
  });

  it('must recognize small talk and greetings warmly without citations', async () => {
    const greetings = ['hi', 'hello', 'namaste', 'నమస్తే', 'thanks', 'bye', 'who are you', 'help'];
    for (const g of greetings) {
      const res = await askClinicalAssistant(g);
      expect(res.type).toBe('smalltalk');
      expect(res.message).toBeDefined();
      expect(res.citation).toBeUndefined(); // No citation for small talk
    }
  });

  it('must ALWAYS escalate danger signs even when preceded by greetings ("hi, she is bleeding heavily")', async () => {
    const query = "hi, she is bleeding heavily";
    const res = await askClinicalAssistant(query);
    expect(res.type).toBe('danger');
    expect(res.category).toContain('Bleeding');
  });
});
