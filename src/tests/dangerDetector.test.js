import { describe, it, expect } from 'vitest';
import { detectDangerSigns } from '../lib/dangerDetector';
import dangerQuestions from '../data/danger_questions.json';

describe('Danger Sign Detection Engine', () => {
  it('must detect 100% of maternal and pediatric emergency test questions (40/40)', () => {
    let passedCount = 0;
    const failures = [];

    dangerQuestions.forEach(item => {
      const result = detectDangerSigns(item.question);
      if (result.isDanger) {
        passedCount++;
      } else {
        failures.push({ id: item.id, question: item.question, expected: item.category });
      }
    });

    if (failures.length > 0) {
      console.error('Failed danger detections:', failures);
    }

    expect(passedCount).toBe(40);
    expect(failures).toHaveLength(0);
  });

  it('must NOT trigger danger alerts on routine questions containing "blood pressure" or "blood sugar"', () => {
    const routineQueries = [
      "What is normal blood pressure during second trimester?",
      "How to check blood pressure with digital cuff?",
      "Dietary advice for high blood pressure and salt reduction",
      "What is the fasting blood sugar level for diabetes?",
      "Patient came for blood sugar test at VHSND"
    ];

    routineQueries.forEach(query => {
      const result = detectDangerSigns(query);
      expect(result.isDanger, `False alarm triggered on query: "${query}"`).toBe(false);
    });
  });

  it('must trigger alert if blood pressure inquiry ALSO contains severe danger signs (e.g. headache & blur)', () => {
    const dangerWithBP = "Patient has high blood pressure with severe headache and blurred vision";
    const result = detectDangerSigns(dangerWithBP);
    expect(result.isDanger).toBe(true);
    expect(result.category).toContain("Severe Headache with Blurred Vision");
  });
});
