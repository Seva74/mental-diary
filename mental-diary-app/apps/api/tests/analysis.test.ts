import { computeAnalysis } from '../src/domain/analysis';
import { demoEntries } from '../src/seed';
import { MentalStateModel } from '../src/ml/mentalStateModel';

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
});
