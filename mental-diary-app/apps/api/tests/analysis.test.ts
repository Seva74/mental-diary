import { computeAnalysis } from '../src/domain/analysis';
import { demoEntries } from '../src/seed';
import { MentalStateModel } from '../src/ml/mentalStateModel';
import { Entry } from '../src/types';

describe('computeAnalysis', () => {
  const model = new MentalStateModel();

  it('derives risk, model state, and explainable factors from seeded entries', () => {
    const analysis = computeAnalysis(demoEntries, model.assess(demoEntries));

    expect(analysis.entryCount).toBe(demoEntries.length);
    expect(analysis.averageMood).toBeLessThan(6);
    expect(['high', 'critical']).toContain(analysis.riskLevel);
    expect(analysis.stateLabel).toBeDefined();
    expect(analysis.confidence).toBeGreaterThan(0.3);
    expect(analysis.factors.length).toBeGreaterThan(0);
    expect(analysis.summary).toContain('Состояние');
  });

  it('handles empty history', () => {
    const analysis = computeAnalysis([], model.assess([]));

    expect(analysis.entryCount).toBe(0);
    expect(analysis.riskLevel).toBe('low');
    expect(analysis.summary).toContain('Пока нет записей');
  });

  it('raises text risk markers for depressive language in notes', () => {
    const entries: Entry[] = [
      {
        id: 'text-risk-1',
        userId: 'u-1',
        createdAt: new Date().toISOString(),
        moodScore: 2,
        energy: 2,
        sleepHours: 4,
        stress: 8,
        notes: 'Мне пусто и безнадёжно, ничего не радует, не хочу ни с кем говорить и чувствую себя обузой.',
        tags: ['isolation', 'hopeless']
      }
    ];

    const analysis = computeAnalysis(entries, model.assess(entries));

    expect(analysis.featureSnapshot.depressiveToneScore).toBeGreaterThan(0);
    expect(analysis.featureSnapshot.hopelessnessScore).toBeGreaterThan(0);
    expect(analysis.featureSnapshot.socialWithdrawalScore).toBeGreaterThan(0);
    expect(analysis.factors.some((factor) => factor.label.toLowerCase().includes('депрессив'))).toBe(true);
  });
});
