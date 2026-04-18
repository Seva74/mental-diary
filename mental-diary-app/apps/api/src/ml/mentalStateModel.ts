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
  depressiveToneScore: number,
  hopelessnessScore: number,
  socialWithdrawalScore: number,
  selfWorthRiskScore: number,
  somaticBurdenScore: number,
  emotionalIntensityScore: number,
  positiveAffectScore: number,
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
  depressiveToneScore,
  hopelessnessScore,
  socialWithdrawalScore,
  selfWorthRiskScore,
  somaticBurdenScore,
  emotionalIntensityScore,
  positiveAffectScore,
  volatilityScore
});

const oneHot = (index: number) => labels.map((_label, currentIndex) => (currentIndex === index ? 1 : 0));

const vary = (value: number, offset: number, factor: number, min: number, max: number) => clamp(value + offset * factor, min, max);

const buildTrainingSet = (): TrainingSample[] => {
  const samples: Array<{ snapshot: ModelFeatureSnapshot; label: MentalStateLabel }> = [];

  const stableProfiles = [
    buildSyntheticSnapshot(7.4, 7.1, 7.8, 3.1, 0.3, -0.1, 0.1, 0.1, 1.2, 0, 0.5, 0.05, 0.02, 0.05, 0.03, 0.2, 0.2, 1.1, 0.4),
    buildSyntheticSnapshot(6.9, 6.6, 7.2, 3.9, 0.2, 0.1, 0, 0.2, 1, 0.1, 0.4, 0.08, 0.03, 0.04, 0.02, 0.3, 0.2, 0.9, 0.5)
  ];

  const fatiguedProfiles = [
    buildSyntheticSnapshot(5.4, 4.1, 5.1, 5, -0.4, 0.2, -0.5, 0.8, 0.4, 0.2, 0.1, 0.3, 0.1, 0.15, 0.12, 0.9, 0.35, 0.25, 0.8),
    buildSyntheticSnapshot(5.1, 3.8, 5.3, 5.6, -0.5, 0.3, -0.2, 0.9, 0.2, 0.4, 0, 0.32, 0.14, 0.18, 0.1, 1.2, 0.3, 0.2, 1.2)
  ];

  const stressedProfiles = [
    buildSyntheticSnapshot(4.8, 5.1, 6.1, 7.3, -0.5, 0.6, -0.2, 1.5, 0.2, 0.4, 0, 0.45, 0.22, 0.2, 0.18, 0.6, 0.5, 0.18, 1),
    buildSyntheticSnapshot(4.5, 4.9, 5.8, 8, -0.6, 0.8, -0.1, 1.7, 0.1, 0.5, 0, 0.52, 0.28, 0.18, 0.16, 0.7, 0.55, 0.12, 1.1)
  ];

  const burnoutProfiles = [
    buildSyntheticSnapshot(3.2, 2.9, 4.5, 8.7, -0.8, 0.7, -0.4, 2, 0, 0.5, 0, 1.4, 1.1, 0.8, 0.9, 1.1, 0.7, 0.05, 1.5),
    buildSyntheticSnapshot(2.8, 2.4, 4.1, 9.1, -0.7, 0.9, -0.5, 2.4, 0, 0.6, 0, 1.7, 1.3, 0.9, 1.1, 1.4, 0.8, 0.03, 1.8)
  ];

  const recoveryProfiles = [
    buildSyntheticSnapshot(6.2, 5.9, 7.1, 4.2, 0.6, -0.5, 0.4, 0.4, 1.4, 0, 0.6, 0.15, 0.05, 0.08, 0.04, 0.35, 0.2, 1.4, 0.6),
    buildSyntheticSnapshot(6.5, 6.1, 7.4, 3.8, 0.7, -0.6, 0.5, 0.3, 1.6, 0, 0.6, 0.1, 0.04, 0.07, 0.04, 0.25, 0.18, 1.6, 0.5)
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
      const offset = ((sampleIndex + 1) * (variant + 1)) % 5 - 2;
      const noisySnapshot: ModelFeatureSnapshot = {
        ...snapshot,
        averageMood: vary(snapshot.averageMood, offset, 0.15, 1, 10),
        averageEnergy: vary(snapshot.averageEnergy, offset, 0.12, 1, 10),
        averageSleepHours: vary(snapshot.averageSleepHours, offset, 0.1, 1, 10),
        averageStress: vary(snapshot.averageStress, offset, 0.18, 1, 10),
        moodTrend: vary(snapshot.moodTrend, offset, 0.04, -2, 2),
        stressTrend: vary(snapshot.stressTrend, offset, 0.05, -2, 2),
        sleepTrend: vary(snapshot.sleepTrend, offset, 0.05, -2, 2),
        noteRiskScore: vary(snapshot.noteRiskScore, offset, 0.08, 0, 4),
        noteRecoveryScore: vary(snapshot.noteRecoveryScore, offset, 0.08, 0, 4),
        tagRiskScore: vary(snapshot.tagRiskScore, offset, 0.04, 0, 1),
        tagRecoveryScore: vary(snapshot.tagRecoveryScore, offset, 0.04, 0, 1),
        depressiveToneScore: vary(snapshot.depressiveToneScore, offset, 0.08, 0, 4),
        hopelessnessScore: vary(snapshot.hopelessnessScore, offset, 0.08, 0, 4),
        socialWithdrawalScore: vary(snapshot.socialWithdrawalScore, offset, 0.06, 0, 4),
        selfWorthRiskScore: vary(snapshot.selfWorthRiskScore, offset, 0.08, 0, 4),
        somaticBurdenScore: vary(snapshot.somaticBurdenScore, offset, 0.08, 0, 4),
        emotionalIntensityScore: vary(snapshot.emotionalIntensityScore, offset, 0.08, 0, 4),
        positiveAffectScore: vary(snapshot.positiveAffectScore, offset, 0.08, 0, 4),
        volatilityScore: vary(snapshot.volatilityScore, offset, 0.05, 0, 3)
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
      return 'Профиль похож на устойчивую перегрузку с депрессивными или выгорающими маркерами в тексте.';
    case 'stressed':
      return 'Профиль указывает на выраженный стрессовый контур и напряжённый язык описания.';
    case 'fatigued':
      return 'Профиль похож на накопленную усталость, соматическое истощение и снижение энергии.';
    case 'recovery':
      return 'Есть признаки восстановления и более поддерживающего эмоционального фона.';
    default:
      return 'Состояние выглядит относительно стабильным и без сильных депрессивных маркеров.';
  }
};

const deriveFactors = (snapshot: ModelFeatureSnapshot): PredictionFactor[] => {
  const factors: PredictionFactor[] = [];

  if (snapshot.depressiveToneScore >= 0.5) {
    factors.push({
      id: 'depressive-tone',
      label: 'Депрессивные маркеры в тексте',
      direction: 'negative',
      impact: round(Math.min(1, snapshot.depressiveToneScore / 2)),
      detail: 'В заметках есть слова о пустоте, безнадёжности, утрате смысла или эмоциональном онемении.'
    });
  }

  if (snapshot.hopelessnessScore >= 0.35) {
    factors.push({
      id: 'hopelessness',
      label: 'Безнадёжность',
      direction: 'negative',
      impact: round(Math.min(1, snapshot.hopelessnessScore / 2)),
      detail: 'Текст показывает снижение веры в улучшение ситуации и отсутствие выхода.'
    });
  }

  if (snapshot.selfWorthRiskScore >= 0.3 || snapshot.socialWithdrawalScore >= 0.3) {
    factors.push({
      id: 'self-worth-and-isolation',
      label: 'Самообесценивание или изоляция',
      direction: 'negative',
      impact: round(Math.min(1, Math.max(snapshot.selfWorthRiskScore, snapshot.socialWithdrawalScore) / 2)),
      detail: 'Есть признаки самообвинения, ощущения обузы или ухода из контакта с людьми.'
    });
  }

  if (snapshot.somaticBurdenScore >= 0.35 || snapshot.averageEnergy <= 4.5) {
    factors.push({
      id: 'somatic-fatigue',
      label: 'Соматическое истощение',
      direction: 'negative',
      impact: round(Math.min(1, Math.max(snapshot.somaticBurdenScore / 2, (5 - snapshot.averageEnergy) / 4))),
      detail: 'Текст и численные метрики указывают на усталость, тяжесть тела, недосып или туман в голове.'
    });
  }

  if (snapshot.positiveAffectScore >= 0.35 || snapshot.noteRecoveryScore >= 0.5) {
    factors.push({
      id: 'recovery-language',
      label: 'Поддерживающий язык',
      direction: 'positive',
      impact: round(Math.min(1, Math.max(snapshot.positiveAffectScore / 2, snapshot.noteRecoveryScore / 3))),
      detail: 'В заметках встречаются слова о поддержке, облегчении, улучшении и восстановлении.'
    });
  }

  if (factors.length === 0) {
    factors.push({
      id: 'baseline',
      label: 'Нейтральный профиль',
      direction: 'positive',
      impact: 0.2,
      detail: 'Сильных негативных текстовых маркеров не найдено, оценка опирается на общую динамику дневника.'
    });
  }

  return factors.sort((left, right) => right.impact - left.impact).slice(0, 4);
};

export class MentalStateModel {
  private readonly network: TinyNeuralNetwork;

  constructor() {
    this.network = new TinyNeuralNetwork({
      inputSize: 19,
      hiddenSize: 14,
      outputSize: labels.length,
      learningRate: 0.04,
      seed: 17
    });
    this.network.train(buildTrainingSet(), 1000);
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
      modelProvider: 'local-neural-network',
      modelVersion: 'local-ts-v2',
      featureSnapshot: snapshot,
      factors,
      explanation: describeState(primaryState)
    };
  }
}
