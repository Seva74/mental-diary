import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { DiaryService } from './services/diaryService';
import { EntryInput, ForumPostInput, SessionContext } from './types';

class RequestValidationError extends Error {
  readonly status = 400;
}

class UnauthorizedError extends Error {
  readonly status = 401;
}

type AuthenticatedRequest = Request & { sessionContext?: SessionContext };

const requiredNumber = (value: unknown, min: number, max: number, fieldName: string) => {
  const numeric = typeof value === 'string' ? Number(value) : value;

  if (typeof numeric !== 'number' || Number.isNaN(numeric) || numeric < min || numeric > max) {
    throw new RequestValidationError(`${fieldName} must be between ${min} and ${max}`);
  }

  return numeric;
};

const parseEntryInput = (body: unknown): EntryInput => {
  if (typeof body !== 'object' || body === null) {
    throw new RequestValidationError('Request body must be an object');
  }

  const candidate = body as Record<string, unknown>;
  const notes = typeof candidate.notes === 'string' ? candidate.notes.trim() : '';
  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
    : [];

  if (!notes) {
    throw new RequestValidationError('notes is required');
  }

  return {
    moodScore: requiredNumber(candidate.moodScore, 1, 10, 'moodScore'),
    energy: requiredNumber(candidate.energy, 1, 10, 'energy'),
    sleepHours: requiredNumber(candidate.sleepHours, 0, 16, 'sleepHours'),
    stress: requiredNumber(candidate.stress, 1, 10, 'stress'),
    notes,
    tags: tags.slice(0, 10)
  };
};

const parseForumPostInput = (body: unknown): ForumPostInput => {
  if (typeof body !== 'object' || body === null) {
    throw new RequestValidationError('Request body must be an object');
  }

  const candidate = body as Record<string, unknown>;
  const authorName = typeof candidate.authorName === 'string' ? candidate.authorName.trim() : '';
  const text = typeof candidate.text === 'string' ? candidate.text.trim() : '';
  const moodTag = candidate.moodTag;

  if (!authorName || authorName.length > 40) {
    throw new RequestValidationError('authorName is required and must be <= 40 chars');
  }

  if (!text || text.length > 500) {
    throw new RequestValidationError('text is required and must be <= 500 chars');
  }

  if (moodTag !== 'support' && moodTag !== 'question' && moodTag !== 'experience') {
    throw new RequestValidationError('moodTag must be support, question, or experience');
  }

  return {
    authorName,
    text,
    moodTag
  };
};

const resolveSessionToken = (request: Request) => {
  const authHeader = request.header('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const sessionHeader = request.header('x-session-token');
  return sessionHeader?.trim() || null;
};

const asyncHandler = (handler: (request: Request, response: Response, next: NextFunction) => Promise<void>) => {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
};

const requireSession = async (request: AuthenticatedRequest, service: DiaryService) => {
  const token = resolveSessionToken(request);

  if (!token) {
    throw new UnauthorizedError('Session token is required');
  }

  const sessionContext = await service.getSessionContext(token);

  if (!sessionContext) {
    throw new UnauthorizedError('Session is invalid or expired');
  }

  request.sessionContext = sessionContext;
  return sessionContext;
};

export const createApp = (service: DiaryService) => {
  const app = express();
  const allowedOrigin = process.env.FRONTEND_ORIGIN;

  app.use(express.json({ limit: '256kb' }));
  app.use(cors({ origin: allowedOrigin || true }));

  app.get('/health', asyncHandler(async (_request, response) => {
    response.json({
      status: 'ok',
      storageMode: (await service.getSystemMeta()).storageMode,
      aiProvider: (await service.getSystemMeta()).ai.provider,
      mlProvider: (await service.getSystemMeta()).ml.provider
    });
  }));

  app.post('/api/auth/guest-session', asyncHandler(async (request, response) => {
    const displayName = typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : undefined;
    response.status(201).json(await service.createGuestSession(displayName));
  }));

  app.get('/api/auth/me', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    response.json(sessionContext);
  }));

  app.get('/api/dashboard', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    response.json(await service.getDashboard(sessionContext));
  }));

  app.get('/api/entries', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    response.json(await service.getEntries(sessionContext));
  }));

  app.post('/api/entries', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    const entry = await service.createEntry(sessionContext, parseEntryInput(request.body));
    response.status(201).json({
      entry,
      dashboard: await service.getDashboard(sessionContext)
    });
  }));

  app.get('/api/analysis', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    response.json(await service.getAnalysis(sessionContext));
  }));

  app.get('/api/recommendations', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    response.json(await service.getRecommendations(sessionContext));
  }));

  app.get('/api/predictions', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    response.json(await service.getPredictionHistory(sessionContext));
  }));

  app.get('/api/system/meta', asyncHandler(async (_request, response) => {
    response.json(await service.getSystemMeta());
  }));

  app.get('/api/support', asyncHandler(async (request, response) => {
    const sessionContext = await requireSession(request as AuthenticatedRequest, service);
    const dashboard = await service.getDashboard(sessionContext);
    response.json(dashboard.supportActions);
  }));

  app.get('/api/forum/posts', asyncHandler(async (_request, response) => {
    response.json(await service.getForumPosts());
  }));

  app.post('/api/forum/posts', asyncHandler(async (request, response) => {
    const post = await service.createForumPost(parseForumPostInput(request.body));
    response.status(201).json({
      post,
      posts: await service.getForumPosts()
    });
  }));

  app.get('/api/blog/articles', asyncHandler(async (_request, response) => {
    response.json(await service.getArticles());
  }));

  app.use((error: Error & { status?: number }, _request: Request, response: Response, _next: NextFunction) => {
    const status = Number.isInteger(error.status) ? Number(error.status) : 500;

    response.status(status).json({
      error: error.message
    });
  });

  return app;
};
