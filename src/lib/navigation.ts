import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Package,
  DollarSign,
  CreditCard,
  Wrench,
  TrendingUp,
  History,
  Link2,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'competitors'
  | 'categories'
  | 'products'
  | 'prices'
  | 'payments'
  | 'services'
  | 'traffic'
  | 'history'
  | 'sources'
  | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'competitors', label: 'Competidores', icon: Building2 },
  { id: 'categories', label: 'Categorías', icon: FolderTree },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'prices', label: 'Precios', icon: DollarSign },
  { id: 'payments', label: 'Métodos de pago', icon: CreditCard },
  { id: 'services', label: 'Servicios', icon: Wrench },
  { id: 'traffic', label: 'Tráfico', icon: TrendingUp },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'sources', label: 'Fuentes', icon: Link2 },
  { id: 'settings', label: 'Configuración', icon: Settings },
];
