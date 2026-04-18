export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type MentalStateLabel = 'stable' | 'fatigued' | 'stressed' | 'burnout-risk' | 'recovery';

export interface ModelFeatureSnapshot {
  averageMood: number;
  averageEnergy: number;
  averageSleepHours: number;
  averageStress: number;
  moodTrend: number;
  stressTrend: number;
  sleepTrend: number;
  noteRiskScore: number;
  noteRecoveryScore: number;
  tagRiskScore: number;
  tagRecoveryScore: number;
  depressiveToneScore: number;
  hopelessnessScore: number;
  socialWithdrawalScore: number;
  selfWorthRiskScore: number;
  somaticBurdenScore: number;
  emotionalIntensityScore: number;
  positiveAffectScore: number;
  volatilityScore: number;
}

export interface PredictionFactor {
  id: string;
  label: string;
  direction: 'positive' | 'negative';
  impact: number;
  detail: string;
}

export interface ModelAssessment {
  primaryState: MentalStateLabel;
  confidence: number;
  stressProbability: number;
  recoveryProbability: number;
  burnoutProbability: number;
  modelProvider: string;
  modelVersion: string;
  featureSnapshot: ModelFeatureSnapshot;
  factors: PredictionFactor[];
  explanation: string;
}

export interface EntryInput {
  moodScore: number;
  energy: number;
  sleepHours: number;
  stress: number;
  notes: string;
  tags: string[];
}

export interface Entry extends EntryInput {
  id: string;
  userId: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string;
  role: 'guest' | 'user' | 'admin';
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionContext {
  user: AppUser;
  session: UserSession;
}

export interface Analysis {
  entryCount: number;
  averageMood: number;
  averageEnergy: number;
  averageSleepHours: number;
  averageStress: number;
  trendScore: number;
  riskLevel: RiskLevel;
  stateLabel: MentalStateLabel;
  confidence: number;
  burnoutProbability: number;
  recoveryProbability: number;
  stressLoad: number;
  protectiveScore: number;
  modelProvider: string;
  modelVersion: string;
  factors: PredictionFactor[];
  featureSnapshot: ModelFeatureSnapshot;
  summary: string;
}

export interface PredictionRecord {
  id: string;
  userId: string;
  createdAt: string;
  latestEntryId: string | null;
  entryCount: number;
  stateLabel: MentalStateLabel;
  riskLevel: RiskLevel;
  confidence: number;
  burnoutProbability: number;
  recoveryProbability: number;
  stressLoad: number;
  protectiveScore: number;
  modelProvider: string;
  modelVersion: string;
  summary: string;
}

export interface Recommendation {
  id: string;
  source: 'rule' | 'ai' | 'fallback';
  title: string;
  detail: string;
  action: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SupportAction {
  id: string;
  title: string;
  summary: string;
  action: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ForumPost {
  id: string;
  authorName: string;
  text: string;
  moodTag: 'support' | 'question' | 'experience';
  createdAt: string;
}

export interface ForumPostInput {
  authorName: string;
  text: string;
  moodTag: 'support' | 'question' | 'experience';
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  readTimeMinutes: number;
  content: string;
}

export interface DashboardData {
  storageMode: 'memory' | 'postgres';
  aiProvider: string;
  supportProvider: string;
  system: SystemMeta;
  viewer: AppUser;
  entries: Entry[];
  analysis: Analysis;
  predictionHistory: PredictionRecord[];
  recommendations: Recommendation[];
  supportActions: SupportAction[];
  forumPosts: ForumPost[];
  articles: Article[];
}

export interface AuthSessionPayload {
  user: AppUser;
  session: UserSession;
}

export interface IntegrationStatus {
  provider: string;
  mode: 'fallback' | 'external';
  configured: boolean;
  description: string;
  contract: string[];
}

export interface SystemMeta {
  storageMode: 'memory' | 'postgres';
  ai: IntegrationStatus;
  support: IntegrationStatus;
  ml: {
    provider: string;
    mode: 'local-trained' | 'external';
    configured: boolean;
    description: string;
    contract: string[];
  };
}
