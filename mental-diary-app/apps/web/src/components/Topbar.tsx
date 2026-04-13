import type { DashboardData } from '../types';
import type { ThemeMode } from '../appTypes';
import { riskLabelMap, riskPillClassMap } from '../lib/dashboard';

interface TopbarProps {
  title: string;
  subtitle: string;
  dashboard: DashboardData | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onReload: () => void;
  pendingOfflineEntries: number;
  syncingOffline: boolean;
  onSyncOffline: () => void;
}

export const Topbar = ({
  title,
  subtitle,
  dashboard,
  theme,
  onToggleTheme,
  onReload,
  pendingOfflineEntries,
  syncingOffline,
  onSyncOffline
}: TopbarProps) => {
  const syncToneClass = pendingOfflineEntries > 0 ? 'pill pill-high' : 'pill pill-low';

  return (
    <header className="topbar">
      <div>
        <strong className="top-title">{title}</strong>
        <div className="top-subtitle">{subtitle}</div>
      </div>
      <div className="top-actions">
        <span className="pill pill-neutral">БД {dashboard?.storageMode || '...'}</span>
        <span className="pill pill-neutral">AI {dashboard ? dashboard.system.ai.mode : '...'}</span>
        <span className="pill pill-neutral">Поддержка {dashboard ? dashboard.system.support.mode : '...'}</span>
        <span className={`sync-pill ${syncToneClass}`}>{syncingOffline ? 'Синхронизация...' : pendingOfflineEntries > 0 ? `${pendingOfflineEntries} локальных черновика` : 'Все синхронизировано'}</span>
        {pendingOfflineEntries > 0 && (
          <button type="button" className="ghost-btn" onClick={onSyncOffline} disabled={syncingOffline}>
            {syncingOffline ? 'Синхронизируем...' : 'Синхронизировать'}
          </button>
        )}
        {dashboard && <span className={riskPillClassMap[dashboard.analysis.riskLevel]}>{riskLabelMap[dashboard.analysis.riskLevel]}</span>}
        <button type="button" className="ghost-btn" onClick={onToggleTheme}>
          Тема: {theme === 'light' ? 'Светлая' : 'Темная'}
        </button>
        <button type="button" className="ghost-btn" onClick={onReload}>Обновить</button>
      </div>
    </header>
  );
};
