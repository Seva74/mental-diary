import { computeAnalysis } from '../domain/analysis';
import { buildRecommendations } from '../domain/recommendations';
import { createAiAdapter, AiAdapter } from '../infrastructure/aiAdapter';
import { createEntryStore, EntryStore } from '../infrastructure/entryStore';
import { createSupportGateway, SupportGateway } from '../infrastructure/supportGateway';
import { createUserStore, UserStore } from '../infrastructure/userStore';
import { MentalStateModel } from '../ml/mentalStateModel';
import { demoArticles, demoEntries, demoForumPosts, demoUser } from '../seed';
import { AppUser, Article, AuthSessionPayload, DashboardData, Entry, EntryInput, ForumPost, ForumPostInput, SessionContext, SystemMeta } from '../types';

export class DiaryService {
  private forumPosts: ForumPost[] = [...demoForumPosts].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  private articles: Article[] = [...demoArticles];

  constructor(
    private readonly store: EntryStore,
    private readonly userStore: UserStore,
    private readonly aiAdapter: AiAdapter,
    private readonly supportGateway: SupportGateway,
    private readonly mentalStateModel: MentalStateModel
  ) {}

  static async create(databaseUrl?: string): Promise<DiaryService> {
    const userStore = await createUserStore(databaseUrl);
    const store = await createEntryStore(databaseUrl);
    return new DiaryService(store, userStore, createAiAdapter(), createSupportGateway(), new MentalStateModel());
  }

  async bootstrap(): Promise<void> {
    await this.userStore.ensureUser(demoUser);
    await this.store.seedEntries(demoUser.id, demoEntries);
  }

  async createGuestSession(displayName?: string): Promise<AuthSessionPayload> {
    return this.userStore.createGuestSession(displayName);
  }

  async getSessionContext(token: string): Promise<SessionContext | null> {
    return this.userStore.getSessionContext(token);
  }

  async getEntries(session: SessionContext): Promise<Entry[]> {
    return this.store.listEntries(session.user.id);
  }

  async createEntry(session: SessionContext, input: EntryInput): Promise<Entry> {
    return this.store.saveEntry(session.user.id, input);
  }

  async getForumPosts(): Promise<ForumPost[]> {
    return [...this.forumPosts].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async createForumPost(input: ForumPostInput): Promise<ForumPost> {
    const post: ForumPost = {
      id: `forum-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authorName: input.authorName,
      text: input.text,
      moodTag: input.moodTag,
      createdAt: new Date().toISOString()
    };

    this.forumPosts.unshift(post);
    return post;
  }

  async getArticles(): Promise<Article[]> {
    return [...this.articles];
  }

  async getDashboard(session: SessionContext): Promise<DashboardData> {
    const entries = await this.store.listEntries(session.user.id);
    const modelAssessment = this.mentalStateModel.assess(entries);
    const analysis = computeAnalysis(entries, modelAssessment);
    const aiMessage = await this.aiAdapter.createAdvice(analysis, entries);
    const recommendations = buildRecommendations(analysis, entries, aiMessage);
    const supportActions = await this.supportGateway.findSupportActions(analysis);
    const system = this.buildSystemMeta();

    return {
      storageMode: this.store.mode,
      aiProvider: this.aiAdapter.provider,
      supportProvider: this.supportGateway.provider,
      system,
      viewer: session.user,
      entries,
      analysis,
      recommendations,
      supportActions,
      forumPosts: await this.getForumPosts(),
      articles: await this.getArticles()
    };
  }

  async getSystemMeta(): Promise<SystemMeta> {
    return this.buildSystemMeta();
  }

  async getAnalysis(session: SessionContext) {
    const entries = await this.store.listEntries(session.user.id);
    return computeAnalysis(entries, this.mentalStateModel.assess(entries));
  }

  async getRecommendations(session: SessionContext) {
    const entries = await this.store.listEntries(session.user.id);
    const analysis = computeAnalysis(entries, this.mentalStateModel.assess(entries));
    const aiMessage = await this.aiAdapter.createAdvice(analysis, entries);
    return buildRecommendations(analysis, entries, aiMessage);
  }

  private buildSystemMeta(): SystemMeta {
    const aiMode = this.aiAdapter.provider === 'fallback' ? 'fallback' : 'external';
    const supportMode = this.supportGateway.provider === 'local-fallback' ? 'fallback' : 'external';

    return {
      storageMode: this.store.mode,
      ai: {
        provider: this.aiAdapter.provider,
        mode: aiMode,
        configured: aiMode === 'external',
        description: aiMode === 'external'
          ? 'AI provider is active and ready for external API integration.'
          : 'Rule-based fallback is active. Backend can later connect OpenAI or Hugging Face here.',
        contract: [
          'analysis.riskLevel',
          'analysis.averageMood',
          'analysis.averageStress',
          'analysis.trendScore',
          'latestEntry.notes'
        ]
      },
      support: {
        provider: this.supportGateway.provider,
        mode: supportMode,
        configured: supportMode === 'external',
        description: supportMode === 'external'
          ? 'External support provider is active.'
          : 'Local fallback support planner is active and can be replaced with a remote self-help API later.',
        contract: [
          'analysis.riskLevel',
          'analysis.averageStress',
          'analysis.averageSleepHours',
          'analysis.trendScore'
        ]
      },
      ml: {
        provider: 'local-neural-network',
        mode: 'local-trained',
        configured: true,
        description: 'A locally trained lightweight neural network evaluates the diary history, textual markers, and trend features.',
        contract: [
          'analysis.stateLabel',
          'analysis.confidence',
          'analysis.burnoutProbability',
          'analysis.recoveryProbability',
          'analysis.factors',
          'analysis.featureSnapshot'
        ]
      }
    };
  }
}
