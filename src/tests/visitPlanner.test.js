import { describe, it, expect } from 'vitest';
import { getRankedVisits, computeDailyStats } from '../lib/visitPlanner';
import sampleHouseholds from '../data/households.json';

describe('Visit Planner & Scheduler Logic', () => {
  it('must place Priority 1 (Urgent/Danger) visits at the top of the schedule', () => {
    const ranked = getRankedVisits(sampleHouseholds, 'all');
    expect(ranked.length).toBeGreaterThan(0);
    
    // The top ranked items must be Priority 1
    expect(ranked[0].patient.priority).toBe(1);
    expect(ranked[1].patient.priority).toBe(1);

    // Verify ordering: no lower priority item should precede a higher priority item
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].patient.priority).toBeLessThanOrEqual(ranked[i + 1].patient.priority);
    }
  });

  it('correctly filters visits by category', () => {
    const ancList = getRankedVisits(sampleHouseholds, 'anc');
    expect(ancList.every(h => h.patient.category === 'Pregnant')).toBe(true);

    const immList = getRankedVisits(sampleHouseholds, 'imm');
    expect(immList.every(h => h.patient.category === 'Child')).toBe(true);

    const ncdList = getRankedVisits(sampleHouseholds, 'ncd');
    expect(ncdList.every(h => h.patient.category === 'NCD')).toBe(true);
  });

  it('correctly computes daily statistics', () => {
    const stats = computeDailyStats(sampleHouseholds);
    expect(stats.scheduledVisits).toBe(30);
    expect(stats.urgentAlerts).toBeGreaterThan(0);
    expect(stats.immunisationsDue).toBeGreaterThan(0);
    expect(stats.followupsDue).toBeGreaterThan(0);
  });

  it('must rank an official 500-household register strictly by Priority 1 -> 2 -> 3 under 15ms', () => {
    const villages = ["Chinnaipalem", "Gollalapalem", "Ramabhadrapuram", "Tallavalasa", "Kothavalasa"];
    const categories = [["Pregnant", 1], ["Child", 2], ["NCD", 3], ["Postnatal", 1], ["Child", 3]];
    
    const households500 = [];
    for (let i = 1; i <= 500; i++) {
      const [cat, prio] = categories[i % categories.length];
      households500.push({
        id: `KV-${String(i).padStart(4, '0')}`,
        head_of_family: `Head ${i}`,
        village: villages[i % villages.length],
        distance_km: 0.5 + (i % 30) * 0.1,
        patient: {
          name: `Patient ${i}`,
          category: cat,
          priority: prio,
          reason: `Checkup ${i}`,
          scheduled_time: "09:00 AM"
        }
      });
    }

    const t0 = performance.now();
    const ranked500 = getRankedVisits(households500, 'all');
    const duration = performance.now() - t0;

    expect(ranked500.length).toBe(500);
    expect(duration).toBeLessThan(15); // Sub-15ms throughput

    // Strict priority ordering check
    for (let i = 0; i < ranked500.length - 1; i++) {
      expect(ranked500[i].patient.priority).toBeLessThanOrEqual(ranked500[i + 1].patient.priority);
    }

    // Verify stats for 500 households
    const stats500 = computeDailyStats(households500);
    expect(stats500.scheduledVisits).toBe(500);
    expect(stats500.urgentAlerts).toBe(200); // 2/5 of 500 = 200
  });
});
