import { RouteConfig, getVisibleRoutes } from './routes';
import { ROUTES } from '../constants';

/**
 * Menu configuration and utilities
 */

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  badge?: string | number;
  children?: MenuItem[];
  divider?: boolean;
  disabled?: boolean;
  external?: boolean;
  onClick?: () => void;
}

/**
 * Convert routes to menu items
 */
export const routesToMenuItems = (routes: RouteConfig[]): MenuItem[] => {
  return routes.map(route => ({
    id: route.name,
    label: route.title,
    path: route.path,
    icon: route.icon,
    children: route.children ? routesToMenuItems(route.children) : undefined,
  }));
};

/**
 * Get main navigation menu
 */
export const getMainMenu = (userPermissions?: string[]): MenuItem[] => {
  const visibleRoutes = getVisibleRoutes(userPermissions);
  return routesToMenuItems(visibleRoutes);
};

/**
 * Get inventory submenu
 */
export const getInventorySubmenu = (): MenuItem[] => [
  {
    id: 'laptops',
    label: 'Laptop',
    path: ROUTES.LAPTOPS,
    icon: '💻',
  },
  {
    id: 'monitors',
    label: 'Monitor',
    path: ROUTES.MONITORS,
    icon: '🖥️',
  },
  {
    id: 'printers',
    label: 'Máy in',
    path: ROUTES.PRINTERS,
    icon: '🖨️',
  },
  {
    id: 'projectors',
    label: 'Máy chiếu',
    path: ROUTES.PROJECTORS,
    icon: '📽️',
  },
  {
    id: 'phones',
    label: 'Điện thoại',
    path: ROUTES.PHONES,
    icon: '📱',
  },
  {
    id: 'tools',
    label: 'Công cụ',
    path: ROUTES.TOOLS,
    icon: '🔧',
  },
];

/**
 * Get user menu (profile dropdown)
 */
export const getUserMenu = (): MenuItem[] => [
  {
    id: 'profile',
    label: 'Hồ sơ cá nhân',
    path: ROUTES.PROFILE,
    icon: '👤',
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    path: ROUTES.SETTINGS,
    icon: '⚙️',
  },
  {
    id: 'divider-1',
    label: '',
    divider: true,
  },
  {
    id: 'logout',
    label: 'Đăng xuất',
    icon: '🚪',
    onClick: () => {
      // Handle logout
      console.log('Logging out...');
    },
  },
];

/**
 * Get context menu for devices
 */
export const getDeviceContextMenu = (device: any): MenuItem[] => {
  const menu: MenuItem[] = [
    {
      id: 'view',
      label: 'Xem chi tiết',
      icon: '👁️',
      path: `/inventory/${device.device_type}/${device.name}`,
    },
    {
      id: 'edit',
      label: 'Chỉnh sửa',
      icon: '✏️',
      path: `/inventory/${device.device_type}/${device.name}/edit`,
    },
  ];

  // Add assignment options based on device status
  if (device.status === 'standby') {
    menu.push({
      id: 'assign',
      label: 'Bàn giao',
      icon: '👥',
      onClick: () => {
        // Handle assignment
      },
    });
  } else if (device.status === 'active') {
    menu.push({
      id: 'revoke',
      label: 'Thu hồi',
      icon: '↩️',
      onClick: () => {
        // Handle revocation
      },
    });
  }

  menu.push(
    {
      id: 'inspect',
      label: 'Kiểm tra',
      icon: '🔍',
      onClick: () => {
        // Handle inspection
      },
    },
    {
      id: 'activity',
      label: 'Lịch sử hoạt động',
      icon: '📋',
      path: `/activities?entity_type=device&entity_id=${device.name}`,
    },
    {
      id: 'divider-1',
      label: '',
      divider: true,
    },
    {
      id: 'duplicate',
      label: 'Nhân bản',
      icon: '📋',
      onClick: () => {
        // Handle duplication
      },
    },
    {
      id: 'export',
      label: 'Xuất dữ liệu',
      icon: '📤',
      onClick: () => {
        // Handle export
      },
    },
    {
      id: 'divider-2',
      label: '',
      divider: true,
    },
    {
      id: 'delete',
      label: 'Xóa',
      icon: '🗑️',
      disabled: device.status === 'active', // Can't delete assigned devices
      onClick: () => {
        // Handle deletion
      },
    }
  );

  return menu;
};

/**
 * Get quick actions menu
 */
export const getQuickActionsMenu = (): MenuItem[] => [
  {
    id: 'add-device',
    label: 'Thêm thiết bị',
    icon: '➕',
    children: [
      {
        id: 'add-laptop',
        label: 'Laptop',
        icon: '💻',
        path: '/inventory/laptops/create',
      },
      {
        id: 'add-monitor',
        label: 'Monitor',
        icon: '🖥️',
        path: '/inventory/monitors/create',
      },
      {
        id: 'add-printer',
        label: 'Máy in',
        icon: '🖨️',
        path: '/inventory/printers/create',
      },
      {
        id: 'add-projector',
        label: 'Máy chiếu',
        icon: '📽️',
        path: '/inventory/projectors/create',
      },
      {
        id: 'add-phone',
        label: 'Điện thoại',
        icon: '📱',
        path: '/inventory/phones/create',
      },
      {
        id: 'add-tool',
        label: 'Công cụ',
        icon: '🔧',
        path: '/inventory/tools/create',
      },
    ],
  },
  {
    id: 'bulk-import',
    label: 'Nhập hàng loạt',
    icon: '📁',
    onClick: () => {
      // Handle bulk import
    },
  },
  {
    id: 'generate-report',
    label: 'Tạo báo cáo',
    icon: '📊',
    children: [
      {
        id: 'inventory-report',
        label: 'Báo cáo thiết bị',
        onClick: () => {
          // Generate inventory report
        },
      },
      {
        id: 'assignment-report',
        label: 'Báo cáo bàn giao',
        onClick: () => {
          // Generate assignment report
        },
      },
      {
        id: 'inspection-report',
        label: 'Báo cáo kiểm tra',
        onClick: () => {
          // Generate inspection report
        },
      },
    ],
  },
];

/**
 * Get filter menu for device lists
 */
export const getFilterMenu = (): MenuItem[] => [
  {
    id: 'filter-status',
    label: 'Trạng thái',
    children: [
      {
        id: 'status-all',
        label: 'Tất cả',
        onClick: () => {
          // Apply filter
        },
      },
      {
        id: 'status-active',
        label: 'Đang sử dụng',
        onClick: () => {
          // Apply filter
        },
      },
      {
        id: 'status-standby',
        label: 'Chờ cấp phát',
        onClick: () => {
          // Apply filter
        },
      },
      {
        id: 'status-broken',
        label: 'Hỏng',
        onClick: () => {
          // Apply filter
        },
      },
    ],
  },
  {
    id: 'filter-type',
    label: 'Loại thiết bị',
    children: getInventorySubmenu().map(item => ({
      ...item,
      id: `type-${item.id}`,
      path: undefined,
      onClick: () => {
        // Apply filter
      },
    })),
  },
  {
    id: 'filter-manufacturer',
    label: 'Nhà sản xuất',
    children: [
      {
        id: 'manufacturer-all',
        label: 'Tất cả',
        onClick: () => {
          // Apply filter
        },
      },
      // Dynamic manufacturer list would be populated here
    ],
  },
  {
    id: 'divider-1',
    label: '',
    divider: true,
  },
  {
    id: 'clear-filters',
    label: 'Xóa bộ lọc',
    icon: '🗑️',
    onClick: () => {
      // Clear all filters
    },
  },
];

/**
 * Check if menu item is active
 */
export const isMenuItemActive = (item: MenuItem, currentPath: string): boolean => {
  if (item.path) {
    return currentPath === item.path || currentPath.startsWith(item.path + '/');
  }
  
  if (item.children) {
    return item.children.some(child => isMenuItemActive(child, currentPath));
  }
  
  return false;
};

/**
 * Find menu item by id
 */
export const findMenuItem = (items: MenuItem[], id: string): MenuItem | undefined => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    
    if (item.children) {
      const found = findMenuItem(item.children, id);
      if (found) {
        return found;
      }
    }
  }
  
  return undefined;
};

/**
 * Get menu item path
 */
export const getMenuItemPath = (items: MenuItem[], id: string): MenuItem[] => {
  const path: MenuItem[] = [];
  
  const findPath = (items: MenuItem[], targetId: string, currentPath: MenuItem[]): boolean => {
    for (const item of items) {
      const newPath = [...currentPath, item];
      
      if (item.id === targetId) {
        path.push(...newPath);
        return true;
      }
      
      if (item.children && findPath(item.children, targetId, newPath)) {
        return true;
      }
    }
    
    return false;
  };
  
  findPath(items, id, []);
  return path;
};