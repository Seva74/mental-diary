import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { demoEntries } from '../seed';
import { Entry, EntryInput } from '../types';

export interface EntryStore {
  mode: 'memory' | 'postgres';
  countEntries(userId?: string): Promise<number>;
  listEntries(userId: string): Promise<Entry[]>;
  saveEntry(userId: string, input: EntryInput, createdAt?: string): Promise<Entry>;
  seedEntries(userId: string, entries: Entry[]): Promise<void>;
}

export class MemoryEntryStore implements EntryStore {
  public readonly mode = 'memory' as const;
  private entries: Entry[] = [];

  constructor() {
    this.entries = [...demoEntries];
  }

  async countEntries(userId?: string): Promise<number> {
    return userId ? this.entries.filter((entry) => entry.userId === userId).length : this.entries.length;
  }

  async listEntries(userId: string): Promise<Entry[]> {
    return this.entries
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async saveEntry(userId: string, input: EntryInput, createdAt = new Date().toISOString()): Promise<Entry> {
    const entry: Entry = {
      id: randomUUID(),
      userId,
      createdAt,
      ...input
    };

    this.entries.push(entry);
    return entry;
  }

  async seedEntries(userId: string, entries: Entry[]): Promise<void> {
    const existingCount = await this.countEntries(userId);

    if (existingCount > 0) {
      return;
    }

    this.entries.push(...entries.map((entry) => ({ ...entry, userId })));
  }
}

export class PostgresEntryStore implements EntryStore {
  public readonly mode = 'postgres' as const;

  constructor(private readonly pool: Pool) {}

  async init(): Promise<void> {
    await this.pool.query(`
      create table if not exists entries (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        created_at timestamptz not null,
        mood_score integer not null,
        energy integer not null,
        sleep_hours numeric(4,1) not null,
        stress integer not null,
        notes text not null,
        tags jsonb not null default '[]'::jsonb
      )
    `);

    await this.pool.query(`
      create index if not exists idx_entries_user_created_at
      on entries (user_id, created_at desc)
    `);
  }

  async countEntries(userId?: string): Promise<number> {
    const result = userId
      ? await this.pool.query<{ count: string }>('select count(*)::text as count from entries where user_id = $1', [userId])
      : await this.pool.query<{ count: string }>('select count(*)::text as count from entries');

    return Number(result.rows[0]?.count ?? '0');
  }

  async listEntries(userId: string): Promise<Entry[]> {
    const result = await this.pool.query<{
      id: string;
      user_id: string;
      created_at: Date;
      mood_score: number;
      energy: number;
      sleep_hours: string;
      stress: number;
      notes: string;
      tags: string[];
    }>(
      'select * from entries where user_id = $1 order by created_at desc',
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at.toISOString(),
      moodScore: row.mood_score,
      energy: row.energy,
      sleepHours: Number(row.sleep_hours),
      stress: row.stress,
      notes: row.notes,
      tags: row.tags ?? []
    }));
  }

  async saveEntry(userId: string, input: EntryInput, createdAt = new Date().toISOString()): Promise<Entry> {
    const entry: Entry = {
      id: randomUUID(),
      userId,
      createdAt,
      ...input
    };

    await this.pool.query(
      `insert into entries (id, user_id, created_at, mood_score, energy, sleep_hours, stress, notes, tags)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [entry.id, entry.userId, entry.createdAt, entry.moodScore, entry.energy, entry.sleepHours, entry.stress, entry.notes, JSON.stringify(entry.tags)]
    );

    return entry;
  }

  async seedEntries(userId: string, entries: Entry[]): Promise<void> {
    const currentCount = await this.countEntries(userId);

    if (currentCount > 0) {
      return;
    }

    for (const entry of entries) {
      await this.pool.query(
        `insert into entries (id, user_id, created_at, mood_score, energy, sleep_hours, stress, notes, tags)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [entry.id, userId, entry.createdAt, entry.moodScore, entry.energy, entry.sleepHours, entry.stress, entry.notes, JSON.stringify(entry.tags)]
      );
    }
  }
}

export const createEntryStore = async (databaseUrl?: string): Promise<EntryStore> => {
  if (!databaseUrl) {
    return new MemoryEntryStore();
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const store = new PostgresEntryStore(pool);
  await store.init();
  return store;
};
