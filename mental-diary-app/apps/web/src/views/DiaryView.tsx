import type { FormEvent } from 'react';
import type { DashboardData, EntryFormState } from '../types';
import { formatDate } from '../lib/date';

interface DiaryViewProps {
  dashboard: DashboardData;
  entryForm: EntryFormState;
  onEntryFieldChange: (field: keyof EntryFormState, value: string | number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  pendingOfflineEntries: number;
  syncingOffline: boolean;
  onSyncOffline: () => void;
}

export const DiaryView = ({
  dashboard,
  entryForm,
  onEntryFieldChange,
  onSubmit,
  saving,
  pendingOfflineEntries,
  syncingOffline,
  onSyncOffline
}: DiaryViewProps) => {
  const notePreview = entryForm.notes.trim() || 'Добавь одну короткую мысль, и аналитика сразу получит хороший контекст.';
  const moodSnapshot = entryForm.stress >= 8
    ? 'Похоже на перегрузку'
    : entryForm.moodScore >= 7 && entryForm.energy >= 7
      ? 'Ровный и ресурсный день'
      : entryForm.stress >= 6
        ? 'Нужен более щадящий режим'
        : 'Рабочий и управляемый ритм';
  const tagPreview = entryForm.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="diary-layout">
      <div className="diary-form-card">
        <div className="diary-day">Ежедневная проверка состояния</div>
        <div className="diary-heading">Как прошёл твой день?</div>

        {pendingOfflineEntries > 0 && (
          <div className="offline-row">
            <span>Локальных записей: {pendingOfflineEntries}</span>
            <button type="button" className="ghost-btn" onClick={onSyncOffline} disabled={syncingOffline || saving}>
              {syncingOffline ? 'Синхронизация...' : 'Синхронизировать'}
            </button>
          </div>
        )}

        <form className="form" onSubmit={onSubmit}>
          <label>
            <span>События и эмоции</span>
            <textarea
              value={entryForm.notes}
              onChange={(event) => onEntryFieldChange('notes', event.target.value)}
              placeholder="Что произошло и как это повлияло на состояние?"
              rows={5}
              required
            />
          </label>

          <div className="sliders">
            <label><span>Настроение {entryForm.moodScore}/10</span><input type="range" min="1" max="10" value={entryForm.moodScore} onChange={(event) => onEntryFieldChange('moodScore', Number(event.target.value))} /></label>
            <label><span>Энергия {entryForm.energy}/10</span><input type="range" min="1" max="10" value={entryForm.energy} onChange={(event) => onEntryFieldChange('energy', Number(event.target.value))} /></label>
            <label><span>Стресс {entryForm.stress}/10</span><input type="range" min="1" max="10" value={entryForm.stress} onChange={(event) => onEntryFieldChange('stress', Number(event.target.value))} /></label>
            <label><span>Сон {entryForm.sleepHours} ч</span><input type="range" min="0" max="12" step="0.5" value={entryForm.sleepHours} onChange={(event) => onEntryFieldChange('sleepHours', Number(event.target.value))} /></label>
          </div>

          <label>
            <span>Теги</span>
            <input type="text" value={entryForm.tags} onChange={(event) => onEntryFieldChange('tags', event.target.value)} placeholder="focus, stress, walk" />
          </label>

          <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить запись'}</button>
        </form>
      </div>

      <div className="diary-right">
        <div className="diary-preview-card">
          <div className="panel-title">Почти готовая запись</div>
          <div className="preview-state">{moodSnapshot}</div>
          <p>{notePreview}</p>
          <div className="preview-grid">
            <div>
              <strong>{entryForm.moodScore}/10</strong>
              <span>Настроение</span>
            </div>
            <div>
              <strong>{entryForm.energy}/10</strong>
              <span>Энергия</span>
            </div>
            <div>
              <strong>{entryForm.stress}/10</strong>
              <span>Стресс</span>
            </div>
            <div>
              <strong>{entryForm.sleepHours} ч</strong>
              <span>Сон</span>
            </div>
          </div>
          {tagPreview.length > 0 && (
            <div className="tag-cloud">
              {tagPreview.map((tag) => (
                <span className="pill pill-neutral" key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="past-entries">
          <div className="panel-title">Последние записи</div>
          <div className="stack-list">
            {dashboard.entries.slice(0, 4).map((entry) => (
              <div className="list-item" key={entry.id}>
                <div>
                  <strong>{formatDate(entry.createdAt)}</strong>
                  <p>{entry.notes}</p>
                </div>
                <div className="pill pill-neutral">{entry.moodScore}/10</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tips-card">
          <div className="tips-tag">✦ Совет дня</div>
          <div className="tips-title">Короткие записи каждый день дают более точную аналитику</div>
          <div className="tips-text">Если нет сил писать подробно, достаточно трех полей: настроение, стресс и одна заметка о событии.</div>
        </div>

        <div className="ai-insight-card" style={{ borderRadius: '16px', padding: '18px' }}>
          <div className="aic-badge"><div className="aic-dot"></div>AI-подсказка для записи</div>
          <div className="aic-text" style={{ fontSize: '13px' }}>«Ты упомянул прогулку — это хороший сигнал для будущих советов и рекомендаций.»</div>
        </div>
      </div>
    </div>
  );
};
