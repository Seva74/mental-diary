import request from 'supertest';
import { createApp } from '../src/app';
import { MemoryEntryStore } from '../src/infrastructure/entryStore';
import { createAiAdapter } from '../src/infrastructure/aiAdapter';
import { createSupportGateway } from '../src/infrastructure/supportGateway';
import { MentalStateModel } from '../src/ml/mentalStateModel';
import { DiaryService } from '../src/services/diaryService';

const createTestService = async () => {
  const service = new DiaryService(
    new MemoryEntryStore(),
    createAiAdapter(),
    createSupportGateway(),
    new MentalStateModel()
  );
  await service.bootstrap();
  return service;
};

describe('API scenarios', () => {
  it('returns dashboard data and accepts a new entry', async () => {
    const app = createApp(await createTestService());
    const dashboardResponse = await request(app).get('/api/dashboard');

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.entries.length).toBeGreaterThan(0);
    expect(dashboardResponse.body.analysis.stateLabel).toBeDefined();

    const createResponse = await request(app)
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
  });

  it('rejects invalid payloads', async () => {
    const app = createApp(await createTestService());

    const response = await request(app)
      .post('/api/entries')
      .send({
        moodScore: 12,
        notes: ''
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
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
    const response = await request(app).get('/api/support');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].action).toBeDefined();
  });
});
