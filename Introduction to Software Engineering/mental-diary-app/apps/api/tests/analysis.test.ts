import { computeAnalysis } from '../src/domain/analysis';
import { demoEntries } from '../src/seed';

describe('computeAnalysis', () => {
  it('derives risk and averages from seeded entries', () => {
    const analysis = computeAnalysis(demoEntries);

    expect(analysis.entryCount).toBe(demoEntries.length);
    expect(analysis.averageMood).toBeLessThan(6);
    expect(['high', 'critical']).toContain(analysis.riskLevel);
    expect(analysis.summary).toContain('Среднее настроение');
  });

  it('handles empty history', () => {
    const analysis = computeAnalysis([]);

    expect(analysis.entryCount).toBe(0);
    expect(analysis.riskLevel).toBe('low');
    expect(analysis.summary).toContain('Пока нет записей');
  });
});