import { navItems, type PageId } from '@/lib/navigation';
import { MadesaLogo, MadesaLogoCompact } from '@/components/Logo';
import { ChevronLeft } from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 h-screen sticky top-0`}
    >
      <div className="h-16 flex items-center border-b border-gray-200 px-4 shrink-0">
        {collapsed ? (
          <div className="flex justify-center w-full">
            <MadesaLogoCompact size={36} />
          </div>
        ) : (
          <MadesaLogo size={30} />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? 'bg-madesa-50 text-madesa-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-2 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft size={18} className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
