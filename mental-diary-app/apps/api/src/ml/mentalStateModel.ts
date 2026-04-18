import { buildFeatureSnapshot, snapshotToVector } from '../domain/featureEngineering';
import { Entry, MentalStateLabel, ModelAssessment, ModelFeatureSnapshot, PredictionFactor } from '../types';
import { TinyNeuralNetwork, TrainingSample } from './neuralNetwork';

const labels: MentalStateLabel[] = ['stable', 'fatigued', 'stressed', 'burnout-risk', 'recovery'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

const buildSyntheticSnapshot = (
  averageMood: number,
  averageEnergy: number,
  averageSleepHours: number,
  averageStress: number,
  moodTrend: number,
  stressTrend: number,
  sleepTrend: number,
  noteRiskScore: number,
  noteRecoveryScore: number,
  tagRiskScore: number,
  tagRecoveryScore: number,
  volatilityScore: number
): ModelFeatureSnapshot => ({
  averageMood,
  averageEnergy,
  averageSleepHours,
  averageStress,
  moodTrend,
  stressTrend,
  sleepTrend,
  noteRiskScore,
  noteRecoveryScore,
  tagRiskScore,
  tagRecoveryScore,
  volatilityScore
});

const oneHot = (index: number) => labels.map((_label, currentIndex) => (currentIndex === index ? 1 : 0));

const buildTrainingSet = (): TrainingSample[] => {
  const samples: Array<{ snapshot: ModelFeatureSnapshot; label: MentalStateLabel }> = [];

  const stableProfiles = [
    buildSyntheticSnapshot(7.4, 7.1, 7.8, 3.1, 0.3, -0.1, 0.1, 0.1, 1.2, 0, 0.5, 0.4),
    buildSyntheticSnapshot(6.9, 6.6, 7.2, 3.9, 0.2, 0.1, 0, 0.2, 1, 0.1, 0.4, 0.5),
    buildSyntheticSnapshot(7.8, 7.5, 8.1, 2.8, 0.1, -0.2, 0.2, 0, 1.4, 0, 0.6, 0.3)
  ];

  const fatiguedProfiles = [
    buildSyntheticSnapshot(5.4, 4.1, 5.1, 5, -0.4, 0.2, -0.5, 0.8, 0.4, 0.2, 0.1, 0.8),
    buildSyntheticSnapshot(5.9, 4.5, 4.8, 5.2, -0.3, 0.1, -0.4, 1.1, 0.3, 0.3, 0, 0.9),
    buildSyntheticSnapshot(5.1, 3.8, 5.3, 5.6, -0.5, 0.3, -0.2, 0.9, 0.2, 0.4, 0, 1.2)
  ];

  const stressedProfiles = [
    buildSyntheticSnapshot(4.8, 5.1, 6.1, 7.3, -0.5, 0.6, -0.2, 1.5, 0.2, 0.4, 0, 1),
    buildSyntheticSnapshot(4.5, 4.9, 5.8, 8, -0.6, 0.8, -0.1, 1.7, 0.1, 0.5, 0, 1.1),
    buildSyntheticSnapshot(5.2, 5.4, 6.4, 7.1, -0.4, 0.5, 0, 1.4, 0.2, 0.3, 0, 1.3)
  ];

  const burnoutProfiles = [
    buildSyntheticSnapshot(3.2, 2.9, 4.5, 8.7, -0.8, 0.7, -0.4, 2, 0, 0.5, 0, 1.5),
    buildSyntheticSnapshot(2.8, 2.4, 4.1, 9.1, -0.7, 0.9, -0.5, 2.4, 0, 0.6, 0, 1.8),
    buildSyntheticSnapshot(3.5, 3.1, 4.9, 8.4, -0.6, 0.8, -0.3, 2.1, 0.1, 0.5, 0, 1.4)
  ];

  const recoveryProfiles = [
    buildSyntheticSnapshot(6.2, 5.9, 7.1, 4.2, 0.6, -0.5, 0.4, 0.4, 1.4, 0, 0.6, 0.6),
    buildSyntheticSnapshot(6.5, 6.1, 7.4, 3.8, 0.7, -0.6, 0.5, 0.3, 1.6, 0, 0.6, 0.5),
    buildSyntheticSnapshot(5.8, 5.5, 6.8, 4.7, 0.8, -0.7, 0.6, 0.5, 1.3, 0.1, 0.5, 0.7)
  ];

  for (const snapshot of stableProfiles) {
    samples.push({ snapshot, label: 'stable' });
  }

  for (const snapshot of fatiguedProfiles) {
    samples.push({ snapshot, label: 'fatigued' });
  }

  for (const snapshot of stressedProfiles) {
    samples.push({ snapshot, label: 'stressed' });
  }

  for (const snapshot of burnoutProfiles) {
    samples.push({ snapshot, label: 'burnout-risk' });
  }

  for (const snapshot of recoveryProfiles) {
    samples.push({ snapshot, label: 'recovery' });
  }

  return samples.flatMap(({ snapshot, label }, sampleIndex) => {
    const labelIndex = labels.indexOf(label);

    return [0, 1, 2, 3].map((variant) => {
      const offset = (sampleIndex + 1) * (variant + 1);
      const noisySnapshot: ModelFeatureSnapshot = {
        ...snapshot,
        averageMood: clamp(snapshot.averageMood + ((offset % 3) - 1) * 0.15, 1, 10),
        averageEnergy: clamp(snapshot.averageEnergy + ((offset % 5) - 2) * 0.12, 1, 10),
        averageSleepHours: clamp(snapshot.averageSleepHours + ((offset % 4) - 1.5) * 0.1, 1, 10),
        averageStress: clamp(snapshot.averageStress + ((offset % 3) - 1) * 0.18, 1, 10),
        moodTrend: clamp(snapshot.moodTrend + ((offset % 5) - 2) * 0.04, -2, 2),
        stressTrend: clamp(snapshot.stressTrend + ((offset % 4) - 1.5) * 0.05, -2, 2),
        sleepTrend: clamp(snapshot.sleepTrend + ((offset % 3) - 1) * 0.05, -2, 2),
        noteRiskScore: clamp(snapshot.noteRiskScore + ((offset % 4) - 1) * 0.08, 0, 4),
        noteRecoveryScore: clamp(snapshot.noteRecoveryScore + ((offset % 4) - 2) * 0.08, 0, 4),
        tagRiskScore: clamp(snapshot.tagRiskScore + ((offset % 3) - 1) * 0.04, 0, 1),
        tagRecoveryScore: clamp(snapshot.tagRecoveryScore + ((offset % 3) - 1) * 0.04, 0, 1),
        volatilityScore: clamp(snapshot.volatilityScore + ((offset % 3) - 1) * 0.05, 0, 3)
      };

      return {
        input: snapshotToVector(noisySnapshot),
        target: oneHot(labelIndex)
      };
    });
  });
};

const describeState = (label: MentalStateLabel) => {
  switch (label) {
    case 'burnout-risk':
      return 'Профиль похож на устойчивую перегрузку и риск выгорания.';
    case 'stressed':
      return 'Профиль указывает на выраженный стрессовый контур.';
    case 'fatigued':
      return 'Профиль похож на накопленную усталость и недостаток восстановления.';
    case 'recovery':
      return 'Есть признаки восстановления после напряженного периода.';
    default:
      return 'Состояние выглядит относительно стабильным.';
  }
};

const deriveFactors = (snapshot: ModelFeatureSnapshot): PredictionFactor[] => {
  const factors: PredictionFactor[] = [];

  if (snapshot.averageStress >= 7) {
    factors.push({
      id: 'stress-high',
      label: 'Высокий стресс',
      direction: 'negative',
      impact: round(snapshot.averageStress / 10),
      detail: `Средний стресс ${snapshot.averageStress}/10 и тренд ${snapshot.stressTrend >= 0 ? 'не снижается' : 'снижается медленно'}.`
    });
  }

  if (snapshot.averageSleepHours <= 5.5) {
    factors.push({
      id: 'sleep-low',
      label: 'Недостаток сна',
      direction: 'negative',
      impact: round((6 - snapshot.averageSleepHours) / 2),
      detail: `Средний сон ${snapshot.averageSleepHours} ч снижает ресурсность и устойчивость к нагрузке.`
    });
  }

  if (snapshot.averageEnergy <= 4.5) {
    factors.push({
      id: 'energy-low',
      label: 'Низкая энергия',
      direction: 'negative',
      impact: round((5 - snapshot.averageEnergy) / 2),
      detail: `Средняя энергия ${snapshot.averageEnergy}/10 указывает на истощение.`
    });
  }

  if (snapshot.moodTrend > 0.25 || snapshot.noteRecoveryScore >= 1) {
    factors.push({
      id: 'recovery-signals',
      label: 'Признаки восстановления',
      direction: 'positive',
      impact: round(Math.max(snapshot.moodTrend, snapshot.noteRecoveryScore / 3)),
      detail: 'Настроение и текст записей содержат маркеры восстановления и опоры.'
    });
  }

  if (snapshot.noteRiskScore >= 1.2 || snapshot.tagRiskScore >= 0.3) {
    factors.push({
      id: 'risk-language',
      label: 'Тревожный словарь',
      direction: 'negative',
      impact: round(Math.max(snapshot.noteRiskScore / 3, snapshot.tagRiskScore)),
      detail: 'В заметках и тегах часто встречаются маркеры перегрузки, тревоги или дедлайнов.'
    });
  }

  if (factors.length === 0) {
    factors.push({
      id: 'baseline',
      label: 'Нейтральный профиль',
      direction: 'positive',
      impact: 0.2,
      detail: 'Выраженных негативных факторов по истории записей не обнаружено.'
    });
  }

  return factors.sort((left, right) => right.impact - left.impact).slice(0, 4);
};

export class MentalStateModel {
  private readonly network: TinyNeuralNetwork;

  constructor() {
    this.network = new TinyNeuralNetwork({
      inputSize: 12,
      hiddenSize: 10,
      outputSize: labels.length,
      learningRate: 0.04,
      seed: 17
    });
    this.network.train(buildTrainingSet(), 900);
  }

  assess(entries: Entry[]): ModelAssessment {
    const snapshot = buildFeatureSnapshot(entries);
    const probabilities = this.network.predict(snapshotToVector(snapshot)).probabilities;
    const maxProbability = Math.max(...probabilities);
    const primaryState = labels[probabilities.indexOf(maxProbability)] ?? 'stable';
    const factors = deriveFactors(snapshot);

    return {
      primaryState,
      confidence: round(maxProbability),
      stressProbability: round((probabilities[labels.indexOf('stressed')] ?? 0) + (probabilities[labels.indexOf('burnout-risk')] ?? 0) * 0.65),
      recoveryProbability: round((probabilities[labels.indexOf('recovery')] ?? 0) + (probabilities[labels.indexOf('stable')] ?? 0) * 0.35),
      burnoutProbability: round(probabilities[labels.indexOf('burnout-risk')] ?? 0),
      featureSnapshot: snapshot,
      factors,
      explanation: describeState(primaryState)
    };
  }
}
