import type { ViewMode } from '../appTypes';

const NAV_ITEMS: Array<{ value: ViewMode; label: string }> = [
  { value: 'home', label: 'Главная' },
  { value: 'diary', label: 'Дневник' },
  { value: 'analysis', label: 'Аналитика' },
  { value: 'support', label: 'Поддержка' },
  { value: 'forum', label: 'Форум' },
  { value: 'blog', label: 'Блог' }
];

interface SidebarProps {
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

export const Sidebar = ({ activeView, onSelectView }: SidebarProps) => {
  return (
    <aside className="sidebar">
      <h1 className="logo">Mental<span>.</span></h1>
      <nav className="menu" aria-label="Навигация по разделам">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={activeView === item.value ? 'menu-item active' : 'menu-item'}
            onClick={() => onSelectView(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};
