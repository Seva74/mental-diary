import request from 'supertest';
import { createApp } from '../src/app';
import { createAiAdapter } from '../src/infrastructure/aiAdapter';
import { MemoryEntryStore } from '../src/infrastructure/entryStore';
import { createMlAdapter } from '../src/infrastructure/mlAdapter';
import { MemoryPredictionStore } from '../src/infrastructure/predictionStore';
import { createSupportGateway } from '../src/infrastructure/supportGateway';
import { MemoryUserStore } from '../src/infrastructure/userStore';
import { DiaryService } from '../src/services/diaryService';

const createTestService = async () => {
  const service = new DiaryService(
    new MemoryEntryStore(),
    new MemoryUserStore(),
    new MemoryPredictionStore(),
    createAiAdapter(),
    createSupportGateway(),
    createMlAdapter()
  );
  await service.bootstrap();
  return service;
};

const createAuthorizedAgent = async (app: ReturnType<typeof createApp>) => {
  const sessionResponse = await request(app)
    .post('/api/auth/guest-session')
    .send({});

  const token = sessionResponse.body.session.token as string;

  return {
    token,
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    post: (path: string) => request(app).post(path).set('Authorization', `Bearer ${token}`)
  };
};

describe('API scenarios', () => {
  it('creates a guest session and returns a user-scoped dashboard', async () => {
    const app = createApp(await createTestService());
    const sessionResponse = await request(app).post('/api/auth/guest-session').send({});

    expect(sessionResponse.status).toBe(201);
    expect(sessionResponse.body.user.id).toBeDefined();
    expect(sessionResponse.body.session.token).toBeDefined();

    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionResponse.body.session.token}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.viewer.id).toBe(sessionResponse.body.user.id);
    expect(dashboardResponse.body.analysis.stateLabel).toBeDefined();
    expect(dashboardResponse.body.analysis.modelVersion).toBeDefined();
    expect(dashboardResponse.body.entries).toEqual([]);
  });

  it('accepts a new entry inside an authenticated session', async () => {
    const app = createApp(await createTestService());
    const agent = await createAuthorizedAgent(app);

    const createResponse = await agent
      .post('/api/entries')
      .send({
        moodScore: 7,
        energy: 7,
        sleepHours: 7,
        stress: 3,
        notes: 'Сегодня стало спокойнее, удалось выспаться и немного восстановиться.',
        tags: ['walk', 'recovery']
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.entry.notes).toContain('спокойнее');
    expect(createResponse.body.dashboard.analysis.confidence).toBeGreaterThan(0);
    expect(createResponse.body.dashboard.entries).toHaveLength(1);
    expect(createResponse.body.dashboard.predictionHistory.length).toBe(1);
  });

  it('rejects invalid payloads', async () => {
    const app = createApp(await createTestService());
    const agent = await createAuthorizedAgent(app);

    const response = await agent
      .post('/api/entries')
      .send({
        moodScore: 12,
        notes: ''
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('rejects protected routes without a session token', async () => {
    const app = createApp(await createTestService());
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Session token');
  });

  it('serves forum and blog prototype modules', async () => {
    const app = createApp(await createTestService());

    const forumResponse = await request(app).get('/api/forum/posts');
    expect(forumResponse.status).toBe(200);
    expect(forumResponse.body.length).toBeGreaterThan(0);

    const createPostResponse = await request(app)
      .post('/api/forum/posts')
      .send({
        authorName: 'Ирина',
        text: 'Помогло заранее ставить короткие паузы в календарь.',
        moodTag: 'experience'
      });

    expect(createPostResponse.status).toBe(201);
    expect(createPostResponse.body.posts[0].authorName).toBe('Ирина');

    const blogResponse = await request(app).get('/api/blog/articles');
    expect(blogResponse.status).toBe(200);
    expect(blogResponse.body.length).toBeGreaterThan(0);
  });

  it('exposes system integration metadata', async () => {
    const app = createApp(await createTestService());
    const response = await request(app).get('/api/system/meta');

    expect(response.status).toBe(200);
    expect(response.body.storageMode).toBeDefined();
    expect(response.body.ai.contract).toContain('analysis.riskLevel');
    expect(response.body.support.mode).toBeDefined();
    expect(response.body.ml.provider).toBe('local-neural-network');
    expect(response.body.ml.contract).toContain('analysis.stateLabel');
  });

  it('serves safe support actions', async () => {
    const app = createApp(await createTestService());
    const agent = await createAuthorizedAgent(app);
    const response = await agent.get('/api/support');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].action).toBeDefined();
  });

  it('returns saved prediction history for the current user', async () => {
    const app = createApp(await createTestService());
    const agent = await createAuthorizedAgent(app);

    await agent.post('/api/entries').send({
      moodScore: 5,
      energy: 4,
      sleepHours: 6,
      stress: 6,
      notes: 'День был напряженным, но удалось немного восстановиться вечером.',
      tags: ['stress', 'recovery']
    });

    const response = await agent.get('/api/predictions');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].stateLabel).toBeDefined();
    expect(response.body[0].modelVersion).toBeDefined();
  });
});
