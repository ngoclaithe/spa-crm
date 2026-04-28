import {
  type LucideIcon,
  Banknote,
  FileSearch,
  ListTree,
  Paintbrush,
  Receipt,
  ScrollText,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';

export type NavId =
  | 'pos'
  | 'debt-collect'
  | 'revenue'
  | 'log'
  | 'debt-manage'
  | 'history'
  | 'ui-config'
  | 'catalog'
  | 'customers';

export type NavItem = { id: NavId; to: string; label: string; icon: LucideIcon };

/**
 * Cấu hình menu trái — 1 nơi, dễ bổ sung màn theo từng route.
 */
export const MAIN_NAV: NavItem[] = [
  { id: 'pos', to: '/pos', label: 'Bán hàng (POS)', icon: ShoppingCart },
  { id: 'debt-collect', to: '/thu-tien-no', label: 'Thu tiền nợ', icon: Banknote },
  { id: 'revenue', to: '/doanh-thu', label: 'Doanh thu & KH', icon: Receipt },
  { id: 'log', to: '/nhat-ky', label: 'Nhật ký giao dịch', icon: ScrollText },
  { id: 'debt-manage', to: '/cong-no', label: 'Quản lý công nợ', icon: Wallet },
  { id: 'history', to: '/tra-cuu', label: 'Tra cứu lịch sử', icon: FileSearch },
  { id: 'ui-config', to: '/giao-dien', label: 'Cấu hình giao diện', icon: Paintbrush },
  { id: 'catalog', to: '/danh-muc', label: 'Quản lý danh mục', icon: ListTree },
  { id: 'customers', to: '/khach-hang', label: 'Quản lý khách hàng', icon: Users },
];
