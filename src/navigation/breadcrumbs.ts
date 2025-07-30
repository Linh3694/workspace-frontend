import { getRouteHierarchy, RouteConfig } from './routes';
import { ROUTES } from '../constants';

/**
 * Breadcrumb utilities
 */

export interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
  icon?: string;
}

/**
 * Generate breadcrumbs from current path
 */
export const generateBreadcrumbs = (currentPath: string, context?: any): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with home
  if (currentPath !== ROUTES.HOME) {
    breadcrumbs.push({
      label: 'Trang chủ',
      path: ROUTES.HOME,
      icon: '🏠',
    });
  }
  
  // Get route hierarchy
  const hierarchy = getRouteHierarchy(currentPath);
  
  // Convert routes to breadcrumbs
  hierarchy.forEach((route, index) => {
    const isLast = index === hierarchy.length - 1;
    
    breadcrumbs.push({
      label: route.title,
      path: isLast ? undefined : route.path,
      active: isLast,
      icon: route.icon,
    });
  });
  
  // Handle dynamic breadcrumbs for detail pages
  if (context) {
    const dynamicCrumbs = getDynamicBreadcrumbs(currentPath, context);
    breadcrumbs.push(...dynamicCrumbs);
  }
  
  return breadcrumbs;
};

/**
 * Get dynamic breadcrumbs for detail pages
 */
export const getDynamicBreadcrumbs = (currentPath: string, context: any): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Device detail page
  if (currentPath.includes('/inventory/') && context.device) {
    const device = context.device;
    const deviceName = device.device_name || device.name || device.serial_number || 'Thiết bị';
    
    breadcrumbs.push({
      label: deviceName,
      active: true,
    });
  }
  
  // Device edit page
  if (currentPath.includes('/edit') && context.device) {
    const device = context.device;
    const deviceName = device.device_name || device.name || device.serial_number || 'Thiết bị';
    
    breadcrumbs.push(
      {
        label: deviceName,
        path: currentPath.replace('/edit', ''),
      },
      {
        label: 'Chỉnh sửa',
        active: true,
        icon: '✏️',
      }
    );
  }
  
  // Device create page
  if (currentPath.includes('/create')) {
    breadcrumbs.push({
      label: 'Thêm mới',
      active: true,
      icon: '➕',
    });
  }
  
  // Activity page with entity context
  if (currentPath.includes('/activities') && context.entity) {
    const entity = context.entity;
    const entityName = entity.device_name || entity.name || 'Thực thể';
    
    breadcrumbs.push({
      label: `Hoạt động - ${entityName}`,
      active: true,
    });
  }
  
  // Inspection detail page
  if (currentPath.includes('/inspections/') && context.inspection) {
    const inspection = context.inspection;
    const inspectionDate = new Date(inspection.inspection_date).toLocaleDateString('vi-VN');
    
    breadcrumbs.push({
      label: `Kiểm tra ${inspectionDate}`,
      active: true,
    });
  }
  
  return breadcrumbs;
};

/**
 * Get breadcrumbs for inventory pages
 */
export const getInventoryBreadcrumbs = (deviceType: string, action?: string, context?: any): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Trang chủ',
      path: ROUTES.HOME,
      icon: '🏠',
    },
    {
      label: 'Quản lý thiết bị',
      path: ROUTES.INVENTORY,
      icon: '📦',
    },
  ];
  
  // Device type
  const deviceTypeLabels: Record<string, { label: string; icon: string; path: string }> = {
    laptop: { label: 'Laptop', icon: '💻', path: ROUTES.LAPTOPS },
    monitor: { label: 'Monitor', icon: '🖥️', path: ROUTES.MONITORS },
    printer: { label: 'Máy in', icon: '🖨️', path: ROUTES.PRINTERS },
    projector: { label: 'Máy chiếu', icon: '📽️', path: ROUTES.PROJECTORS },
    phone: { label: 'Điện thoại', icon: '📱', path: ROUTES.PHONES },
    tool: { label: 'Công cụ', icon: '🔧', path: ROUTES.TOOLS },
  };
  
  const typeConfig = deviceTypeLabels[deviceType];
  if (typeConfig) {
    breadcrumbs.push({
      label: typeConfig.label,
      path: action ? typeConfig.path : undefined,
      active: !action,
      icon: typeConfig.icon,
    });
  }
  
  // Action-specific breadcrumbs
  if (action === 'create') {
    breadcrumbs.push({
      label: 'Thêm mới',
      active: true,
      icon: '➕',
    });
  } else if (action === 'edit' && context?.device) {
    const device = context.device;
    const deviceName = device.device_name || device.name || device.serial_number || 'Thiết bị';
    
    breadcrumbs.push(
      {
        label: deviceName,
        path: `/inventory/${deviceType}/${device.name}`,
      },
      {
        label: 'Chỉnh sửa',
        active: true,
        icon: '✏️',
      }
    );
  } else if (action === 'detail' && context?.device) {
    const device = context.device;
    const deviceName = device.device_name || device.name || device.serial_number || 'Thiết bị';
    
    breadcrumbs.push({
      label: deviceName,
      active: true,
    });
  }
  
  return breadcrumbs;
};

/**
 * Get breadcrumbs for activity pages
 */
export const getActivityBreadcrumbs = (entityType?: string, entityId?: string, context?: any): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Trang chủ',
      path: ROUTES.HOME,
      icon: '🏠',
    },
    {
      label: 'Hoạt động',
      path: entityType && entityId ? ROUTES.ACTIVITIES : undefined,
      active: !entityType && !entityId,
      icon: '📋',
    },
  ];
  
  // Entity-specific breadcrumbs
  if (entityType && entityId && context?.entity) {
    const entity = context.entity;
    const entityName = entity.device_name || entity.name || 'Thực thể';
    
    breadcrumbs.push({
      label: `${entityName}`,
      active: true,
    });
  }
  
  return breadcrumbs;
};

/**
 * Get breadcrumbs for inspection pages
 */
export const getInspectionBreadcrumbs = (inspectionId?: string, context?: any): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Trang chủ',
      path: ROUTES.HOME,
      icon: '🏠',
    },
    {
      label: 'Kiểm tra',
      path: inspectionId ? ROUTES.INSPECTIONS : undefined,
      active: !inspectionId,
      icon: '🔍',
    },
  ];
  
  // Inspection detail breadcrumbs
  if (inspectionId && context?.inspection) {
    const inspection = context.inspection;
    const inspectionDate = new Date(inspection.inspection_date).toLocaleDateString('vi-VN');
    const deviceName = inspection.device_name || 'Thiết bị';
    
    breadcrumbs.push({
      label: `${deviceName} - ${inspectionDate}`,
      active: true,
    });
  }
  
  return breadcrumbs;
};

/**
 * Format breadcrumb label
 */
export const formatBreadcrumbLabel = (label: string, maxLength = 30): string => {
  if (label.length <= maxLength) {
    return label;
  }
  
  return label.substring(0, maxLength - 3) + '...';
};

/**
 * Check if breadcrumb should show separator
 */
export const shouldShowSeparator = (index: number, total: number): boolean => {
  return index < total - 1;
};

/**
 * Get breadcrumb schema for SEO
 */
export const getBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[], baseUrl: string): any => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs
      .filter(crumb => crumb.path)
      .map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: `${baseUrl}${crumb.path}`,
      })),
  };
};