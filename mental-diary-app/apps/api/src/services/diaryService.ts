import { computeAnalysis } from '../domain/analysis';
import { buildRecommendations } from '../domain/recommendations';
import { createAiAdapter, AiAdapter } from '../infrastructure/aiAdapter';
import { createEntryStore, EntryStore } from '../infrastructure/entryStore';
import { createSpecialistGateway, SpecialistGateway } from '../infrastructure/specialistGateway';
import { demoArticles, demoEntries, demoForumPosts } from '../seed';
import { Article, DashboardData, Entry, EntryInput, ForumPost, ForumPostInput } from '../types';

export class DiaryService {
  private forumPosts: ForumPost[] = [...demoForumPosts].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  private articles: Article[] = [...demoArticles];

  constructor(
    private readonly store: EntryStore,
    private readonly aiAdapter: AiAdapter,
    private readonly specialistGateway: SpecialistGateway
  ) {}

  static async create(databaseUrl?: string): Promise<DiaryService> {
    const store = await createEntryStore(databaseUrl);
    return new DiaryService(store, createAiAdapter(), createSpecialistGateway());
  }

  async bootstrap(): Promise<void> {
    await this.store.seedEntries(demoEntries);
  }

  async getEntries(): Promise<Entry[]> {
    return this.store.listEntries();
  }

  async createEntry(input: EntryInput): Promise<Entry> {
    return this.store.saveEntry(input);
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

  async getDashboard(): Promise<DashboardData> {
    const entries = await this.store.listEntries();
    const analysis = computeAnalysis(entries);
    const aiMessage = await this.aiAdapter.createAdvice(analysis, entries);
    const recommendations = buildRecommendations(analysis, entries, aiMessage);
    const specialists = await this.specialistGateway.findSpecialists(analysis);

    return {
      storageMode: this.store.mode,
      aiProvider: this.aiAdapter.provider,
      specialistProvider: this.specialistGateway.provider,
      entries,
      analysis,
      recommendations,
      specialists,
      forumPosts: await this.getForumPosts(),
      articles: await this.getArticles()
    };
  }

  async getAnalysis() {
    const entries = await this.store.listEntries();
    return computeAnalysis(entries);
  }

  async getRecommendations() {
    const entries = await this.store.listEntries();
    const analysis = computeAnalysis(entries);
    const aiMessage = await this.aiAdapter.createAdvice(analysis, entries);
    return buildRecommendations(analysis, entries, aiMessage);
  }
}