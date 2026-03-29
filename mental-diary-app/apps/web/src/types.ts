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

export interface Specialist {
  id: string;
  name: string;
  specialization: string;
  availability: string;
  contact: string;
  reason: string;
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
  specialistProvider: string;
  entries: Entry[];
  analysis: Analysis;
  recommendations: Recommendation[];
  specialists: Specialist[];
  forumPosts: ForumPost[];
  articles: Article[];
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