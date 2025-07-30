import { ROUTES } from '../constants';

/**
 * Navigation utility functions
 */

/**
 * Navigate to a route
 */
export const navigateTo = (path: string, replace = false): void => {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  
  // Dispatch a custom event to notify React Router
  window.dispatchEvent(new PopStateEvent('popstate'));
};

/**
 * Go back in history
 */
export const goBack = (): void => {
  window.history.back();
};

/**
 * Go forward in history
 */
export const goForward = (): void => {
  window.history.forward();
};

/**
 * Get current path
 */
export const getCurrentPath = (): string => {
  return window.location.pathname;
};

/**
 * Get current search params
 */
export const getCurrentSearchParams = (): URLSearchParams => {
  return new URLSearchParams(window.location.search);
};

/**
 * Build URL with search params
 */
export const buildUrl = (path: string, params?: Record<string, string | number | boolean>): string => {
  if (!params) {
    return path;
  }
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

/**
 * Parse search parameters from URL
 */
export const parseSearchParams = (search?: string): Record<string, string> => {
  const searchString = search || window.location.search;
  const params = new URLSearchParams(searchString);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

/**
 * Update search parameters without navigation
 */
export const updateSearchParams = (params: Record<string, string | number | boolean | null>, replace = true): void => {
  const currentParams = getCurrentSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      currentParams.delete(key);
    } else {
      currentParams.set(key, String(value));
    }
  });
  
  const newUrl = `${getCurrentPath()}?${currentParams.toString()}`;
  
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
};

/**
 * Check if current path matches route
 */
export const isCurrentRoute = (route: string): boolean => {
  return getCurrentPath() === route;
};

/**
 * Check if current path starts with route
 */
export const isRouteActive = (route: string): boolean => {
  return getCurrentPath().startsWith(route);
};

/**
 * Get inventory route for device type
 */
export const getInventoryRoute = (deviceType: string): string => {
  const routeMap: Record<string, string> = {
    laptop: ROUTES.LAPTOPS,
    monitor: ROUTES.MONITORS,
    printer: ROUTES.PRINTERS,
    projector: ROUTES.PROJECTORS,
    phone: ROUTES.PHONES,
    tool: ROUTES.TOOLS,
  };
  
  return routeMap[deviceType] || ROUTES.INVENTORY;
};

/**
 * Get device detail route
 */
export const getDeviceDetailRoute = (deviceType: string, deviceId: string): string => {
  const baseRoute = getInventoryRoute(deviceType);
  return `${baseRoute}/${deviceId}`;
};

/**
 * Get device edit route
 */
export const getDeviceEditRoute = (deviceType: string, deviceId: string): string => {
  const baseRoute = getInventoryRoute(deviceType);
  return `${baseRoute}/${deviceId}/edit`;
};

/**
 * Get device create route
 */
export const getDeviceCreateRoute = (deviceType: string): string => {
  const baseRoute = getInventoryRoute(deviceType);
  return `${baseRoute}/create`;
};

/**
 * Get inspection route for device
 */
export const getInspectionRoute = (deviceId: string): string => {
  return `${ROUTES.INSPECTIONS}?device_id=${deviceId}`;
};

/**
 * Get activity route for device
 */
export const getActivityRoute = (entityType: string, entityId: string): string => {
  return `${ROUTES.ACTIVITIES}?entity_type=${entityType}&entity_id=${entityId}`;
};

/**
 * External link handler
 */
export const openExternalLink = (url: string, target = '_blank'): void => {
  window.open(url, target);
};

/**
 * Download link handler
 */
export const downloadFile = (url: string, filename?: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || '';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Scroll to element
 */
export const scrollToElement = (elementId: string, behavior: ScrollBehavior = 'smooth'): void => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior });
  }
};

/**
 * Scroll to top
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth'): void => {
  window.scrollTo({ top: 0, behavior });
};

/**
 * Check if user can navigate back
 */
export const canGoBack = (): boolean => {
  return window.history.length > 1;
};

/**
 * Get route title
 */
export const getRouteTitle = (path: string): string => {
  const titleMap: Record<string, string> = {
    [ROUTES.HOME]: 'Trang chủ',
    [ROUTES.DASHBOARD]: 'Dashboard',
    [ROUTES.INVENTORY]: 'Quản lý thiết bị',
    [ROUTES.LAPTOPS]: 'Laptop',
    [ROUTES.MONITORS]: 'Monitor',
    [ROUTES.PRINTERS]: 'Máy in',
    [ROUTES.PROJECTORS]: 'Máy chiếu',
    [ROUTES.PHONES]: 'Điện thoại',
    [ROUTES.TOOLS]: 'Công cụ',
    [ROUTES.ACTIVITIES]: 'Hoạt động',
    [ROUTES.INSPECTIONS]: 'Kiểm tra',
    [ROUTES.SETTINGS]: 'Cài đặt',
    [ROUTES.PROFILE]: 'Hồ sơ',
    [ROUTES.LOGIN]: 'Đăng nhập',
  };
  
  return titleMap[path] || 'Wellspring Inventory System';
};

/**
 * Get breadcrumb items
 */
export const getBreadcrumbItems = (path: string): Array<{ label: string; path: string }> => {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'Trang chủ', path: ROUTES.HOME }
  ];
  
  let currentPath = '';
  segments.forEach(segment => {
    currentPath += `/${segment}`;
    const title = getRouteTitle(currentPath);
    if (title !== 'Wellspring Inventory System') {
      breadcrumbs.push({ label: title, path: currentPath });
    }
  });
  
  return breadcrumbs;
};

/**
 * Handle browser back button
 */
export const onBackButton = (callback: () => void): (() => void) => {
  const handlePopState = () => {
    callback();
  };
  
  window.addEventListener('popstate', handlePopState);
  
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
};

/**
 * Prevent navigation if there are unsaved changes
 */
export const preventNavigation = (hasUnsavedChanges: boolean, message = 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?'): (() => void) => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  };
  
  const handlePopState = (e: PopStateEvent) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(message);
      if (!confirm) {
        window.history.pushState({}, '', window.location.href);
      }
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
  };
};