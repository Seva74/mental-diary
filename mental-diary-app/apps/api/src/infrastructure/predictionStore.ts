import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { Analysis, Entry, PredictionRecord } from '../types';

export interface PredictionStore {
  mode: 'memory' | 'postgres';
  saveSnapshot(userId: string, entries: Entry[], analysis: Analysis): Promise<PredictionRecord | null>;
  listSnapshots(userId: string, limit?: number): Promise<PredictionRecord[]>;
}

const buildSignature = (entries: Entry[], analysis: Analysis) => {
  const latestEntryId = entries[0]?.id ?? 'none';
  return `${latestEntryId}:${entries.length}:${analysis.stateLabel}:${analysis.riskLevel}`;
};

const toPredictionRecord = (userId: string, entries: Entry[], analysis: Analysis): PredictionRecord => ({
  id: randomUUID(),
  userId,
  createdAt: new Date().toISOString(),
  latestEntryId: entries[0]?.id ?? null,
  entryCount: entries.length,
  stateLabel: analysis.stateLabel,
  riskLevel: analysis.riskLevel,
  confidence: analysis.confidence,
  burnoutProbability: analysis.burnoutProbability,
  recoveryProbability: analysis.recoveryProbability,
  stressLoad: analysis.stressLoad,
  protectiveScore: analysis.protectiveScore,
  summary: analysis.summary
});

export class MemoryPredictionStore implements PredictionStore {
  public readonly mode = 'memory' as const;
  private snapshots: PredictionRecord[] = [];
  private readonly seenByUser = new Map<string, string>();

  async saveSnapshot(userId: string, entries: Entry[], analysis: Analysis): Promise<PredictionRecord | null> {
    if (entries.length === 0) {
      return null;
    }

    const signature = buildSignature(entries, analysis);

    if (this.seenByUser.get(userId) === signature) {
      return null;
    }

    this.seenByUser.set(userId, signature);
    const record = toPredictionRecord(userId, entries, analysis);
    this.snapshots.unshift(record);
    return record;
  }

  async listSnapshots(userId: string, limit = 10): Promise<PredictionRecord[]> {
    return this.snapshots.filter((record) => record.userId === userId).slice(0, limit);
  }
}

export class PostgresPredictionStore implements PredictionStore {
  public readonly mode = 'postgres' as const;

  constructor(private readonly pool: Pool) {}

  async init(): Promise<void> {
    await this.pool.query(`
      create table if not exists prediction_history (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        created_at timestamptz not null,
        latest_entry_id text,
        entry_count integer not null,
        state_label text not null,
        risk_level text not null,
        confidence numeric(5,4) not null,
        burnout_probability numeric(5,4) not null,
        recovery_probability numeric(5,4) not null,
        stress_load numeric(5,4) not null,
        protective_score numeric(5,4) not null,
        summary text not null,
        snapshot_signature text not null,
        unique (user_id, snapshot_signature)
      )
    `);
  }

  async saveSnapshot(userId: string, entries: Entry[], analysis: Analysis): Promise<PredictionRecord | null> {
    if (entries.length === 0) {
      return null;
    }

    const record = toPredictionRecord(userId, entries, analysis);
    const signature = buildSignature(entries, analysis);
    const result = await this.pool.query<{ inserted: boolean }>(
      `insert into prediction_history (
         id, user_id, created_at, latest_entry_id, entry_count, state_label, risk_level,
         confidence, burnout_probability, recovery_probability, stress_load, protective_score, summary, snapshot_signature
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       on conflict (user_id, snapshot_signature) do nothing
       returning true as inserted`,
      [
        record.id,
        record.userId,
        record.createdAt,
        record.latestEntryId,
        record.entryCount,
        record.stateLabel,
        record.riskLevel,
        record.confidence,
        record.burnoutProbability,
        record.recoveryProbability,
        record.stressLoad,
        record.protectiveScore,
        record.summary,
        signature
      ]
    );

    return result.rows[0]?.inserted ? record : null;
  }

  async listSnapshots(userId: string, limit = 10): Promise<PredictionRecord[]> {
    const result = await this.pool.query<{
      id: string;
      user_id: string;
      created_at: Date;
      latest_entry_id: string | null;
      entry_count: number;
      state_label: PredictionRecord['stateLabel'];
      risk_level: PredictionRecord['riskLevel'];
      confidence: string;
      burnout_probability: string;
      recovery_probability: string;
      stress_load: string;
      protective_score: string;
      summary: string;
    }>(
      `select
         id, user_id, created_at, latest_entry_id, entry_count, state_label, risk_level,
         confidence, burnout_probability, recovery_probability, stress_load, protective_score, summary
       from prediction_history
       where user_id = $1
       order by created_at desc
       limit $2`,
      [userId, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at.toISOString(),
      latestEntryId: row.latest_entry_id,
      entryCount: row.entry_count,
      stateLabel: row.state_label,
      riskLevel: row.risk_level,
      confidence: Number(row.confidence),
      burnoutProbability: Number(row.burnout_probability),
      recoveryProbability: Number(row.recovery_probability),
      stressLoad: Number(row.stress_load),
      protectiveScore: Number(row.protective_score),
      summary: row.summary
    }));
  }
}

export const createPredictionStore = async (databaseUrl?: string): Promise<PredictionStore> => {
  if (!databaseUrl) {
    return new MemoryPredictionStore();
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const store = new PostgresPredictionStore(pool);
  await store.init();
  return store;
};
