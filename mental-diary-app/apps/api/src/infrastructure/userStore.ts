import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { AppUser, SessionContext, UserSession } from '../types';

const guestExpiryMs = 1000 * 60 * 60 * 24 * 30;

export interface UserStore {
  mode: 'memory' | 'postgres';
  ensureUser(user: AppUser): Promise<AppUser>;
  createGuestSession(displayName?: string): Promise<SessionContext>;
  getSessionContext(token: string): Promise<SessionContext | null>;
}

const buildGuestUser = (displayName?: string): AppUser => ({
  id: randomUUID(),
  email: null,
  displayName: displayName?.trim() || `Guest ${Math.random().toString(36).slice(2, 6)}`,
  role: 'guest',
  createdAt: new Date().toISOString()
});

const buildSession = (userId: string): UserSession => ({
  id: randomUUID(),
  userId,
  token: randomUUID(),
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + guestExpiryMs).toISOString()
});

export class MemoryUserStore implements UserStore {
  public readonly mode = 'memory' as const;
  private readonly users = new Map<string, AppUser>();
  private readonly sessions = new Map<string, UserSession>();

  async ensureUser(user: AppUser): Promise<AppUser> {
    this.users.set(user.id, user);
    return user;
  }

  async createGuestSession(displayName?: string): Promise<SessionContext> {
    const user = await this.ensureUser(buildGuestUser(displayName));
    const session = buildSession(user.id);
    this.sessions.set(session.token, session);
    return { user, session };
  }

  async getSessionContext(token: string): Promise<SessionContext | null> {
    const session = this.sessions.get(token);

    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    const user = this.users.get(session.userId);
    return user ? { user, session } : null;
  }
}

export class PostgresUserStore implements UserStore {
  public readonly mode = 'postgres' as const;

  constructor(private readonly pool: Pool) {}

  async init(): Promise<void> {
    await this.pool.query(`
      create table if not exists users (
        id text primary key,
        email text,
        display_name text not null,
        role text not null,
        created_at timestamptz not null
      )
    `);

    await this.pool.query(`
      create table if not exists user_sessions (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        token text not null unique,
        created_at timestamptz not null,
        expires_at timestamptz not null
      )
    `);
  }

  async ensureUser(user: AppUser): Promise<AppUser> {
    await this.pool.query(
      `insert into users (id, email, display_name, role, created_at)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do update
       set email = excluded.email,
           display_name = excluded.display_name,
           role = excluded.role`,
      [user.id, user.email, user.displayName, user.role, user.createdAt]
    );
    return user;
  }

  async createGuestSession(displayName?: string): Promise<SessionContext> {
    const user = await this.ensureUser(buildGuestUser(displayName));
    const session = buildSession(user.id);

    await this.pool.query(
      `insert into user_sessions (id, user_id, token, created_at, expires_at)
       values ($1, $2, $3, $4, $5)`,
      [session.id, session.userId, session.token, session.createdAt, session.expiresAt]
    );

    return { user, session };
  }

  async getSessionContext(token: string): Promise<SessionContext | null> {
    const result = await this.pool.query<{
      user_id: string;
      email: string | null;
      display_name: string;
      role: 'guest' | 'user' | 'admin';
      user_created_at: Date;
      session_id: string;
      session_created_at: Date;
      session_expires_at: Date;
      token: string;
    }>(
      `select
         u.id as user_id,
         u.email,
         u.display_name,
         u.role,
         u.created_at as user_created_at,
         s.id as session_id,
         s.created_at as session_created_at,
         s.expires_at as session_expires_at,
         s.token
       from user_sessions s
       join users u on u.id = s.user_id
       where s.token = $1 and s.expires_at > now()`,
      [token]
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      user: {
        id: row.user_id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
        createdAt: row.user_created_at.toISOString()
      },
      session: {
        id: row.session_id,
        userId: row.user_id,
        token: row.token,
        createdAt: row.session_created_at.toISOString(),
        expiresAt: row.session_expires_at.toISOString()
      }
    };
  }
}

export const createUserStore = async (databaseUrl?: string): Promise<UserStore> => {
  if (!databaseUrl) {
    return new MemoryUserStore();
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const store = new PostgresUserStore(pool);
  await store.init();
  return store;
};
