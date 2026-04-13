export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface Entry {
  id: string;
  userId: string;
  createdAt: string;
  moodScore: number;
  energy: number;
  sleepHours: number;
  stress: number;
  notes: string;
  tags: string[];
}

export interface Analysis {
  entryCount: number;
  averageMood: number;
  averageEnergy: number;
  averageSleepHours: number;
  averageStress: number;
  trendScore: number;
  riskLevel: RiskLevel;
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
  entries: Entry[];
  analysis: Analysis;
  recommendations: Recommendation[];
  supportActions: SupportAction[];
  forumPosts: ForumPost[];
  articles: Article[];
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
}

export interface EntryFormState {
  moodScore: number;
  energy: number;
  sleepHours: number;
  stress: number;
  notes: string;
  tags: string;
}

export interface ForumFormState {
  authorName: string;
  text: string;
  moodTag: 'support' | 'question' | 'experience';
}