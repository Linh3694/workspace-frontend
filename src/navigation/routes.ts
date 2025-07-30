import { ROUTES } from '../constants';

/**
 * Route definitions and navigation logic
 */

export interface RouteConfig {
  path: string;
  name: string;
  title: string;
  icon?: string;
  exact?: boolean;
  requiresAuth?: boolean;
  permissions?: string[];
  children?: RouteConfig[];
  hidden?: boolean;
}

/**
 * Main application routes
 */
export const routes: RouteConfig[] = [
  {
    path: ROUTES.HOME,
    name: 'home',
    title: 'Trang chủ',
    icon: '🏠',
    exact: true,
    requiresAuth: true,
  },
  {
    path: ROUTES.DASHBOARD,
    name: 'dashboard',
    title: 'Dashboard',
    icon: '📊',
    requiresAuth: true,
  },
  {
    path: ROUTES.INVENTORY,
    name: 'inventory',
    title: 'Quản lý thiết bị',
    icon: '📦',
    requiresAuth: true,
    children: [
      {
        path: ROUTES.LAPTOPS,
        name: 'laptops',
        title: 'Laptop',
        icon: '💻',
        requiresAuth: true,
      },
      {
        path: ROUTES.MONITORS,
        name: 'monitors',
        title: 'Monitor',
        icon: '🖥️',
        requiresAuth: true,
      },
      {
        path: ROUTES.PRINTERS,
        name: 'printers',
        title: 'Máy in',
        icon: '🖨️',
        requiresAuth: true,
      },
      {
        path: ROUTES.PROJECTORS,
        name: 'projectors',
        title: 'Máy chiếu',
        icon: '📽️',
        requiresAuth: true,
      },
      {
        path: ROUTES.PHONES,
        name: 'phones',
        title: 'Điện thoại',
        icon: '📱',
        requiresAuth: true,
      },
      {
        path: ROUTES.TOOLS,
        name: 'tools',
        title: 'Công cụ',
        icon: '🔧',
        requiresAuth: true,
      },
    ],
  },
  {
    path: ROUTES.ACTIVITIES,
    name: 'activities',
    title: 'Hoạt động',
    icon: '📋',
    requiresAuth: true,
  },
  {
    path: ROUTES.INSPECTIONS,
    name: 'inspections',
    title: 'Kiểm tra',
    icon: '🔍',
    requiresAuth: true,
  },
  {
    path: ROUTES.SETTINGS,
    name: 'settings',
    title: 'Cài đặt',
    icon: '⚙️',
    requiresAuth: true,
  },
  {
    path: ROUTES.PROFILE,
    name: 'profile',
    title: 'Hồ sơ',
    icon: '👤',
    requiresAuth: true,
    hidden: true, // Hidden from main navigation
  },
  {
    path: ROUTES.LOGIN,
    name: 'login',
    title: 'Đăng nhập',
    icon: '🔐',
    requiresAuth: false,
    hidden: true,
  },
];

/**
 * Get route by path
 */
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  const findRoute = (routes: RouteConfig[]): RouteConfig | undefined => {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }
      if (route.children) {
        const childRoute = findRoute(route.children);
        if (childRoute) {
          return childRoute;
        }
      }
    }
    return undefined;
  };
  
  return findRoute(routes);
};

/**
 * Get route by name
 */
export const getRouteByName = (name: string): RouteConfig | undefined => {
  const findRoute = (routes: RouteConfig[]): RouteConfig | undefined => {
    for (const route of routes) {
      if (route.name === name) {
        return route;
      }
      if (route.children) {
        const childRoute = findRoute(route.children);
        if (childRoute) {
          return childRoute;
        }
      }
    }
    return undefined;
  };
  
  return findRoute(routes);
};

/**
 * Get all routes (flattened)
 */
export const getAllRoutes = (): RouteConfig[] => {
  const flattenRoutes = (routes: RouteConfig[]): RouteConfig[] => {
    const result: RouteConfig[] = [];
    
    for (const route of routes) {
      result.push(route);
      if (route.children) {
        result.push(...flattenRoutes(route.children));
      }
    }
    
    return result;
  };
  
  return flattenRoutes(routes);
};

/**
 * Get visible routes for navigation
 */
export const getVisibleRoutes = (userPermissions?: string[]): RouteConfig[] => {
  const filterRoutes = (routes: RouteConfig[]): RouteConfig[] => {
    return routes
      .filter(route => {
        // Filter hidden routes
        if (route.hidden) {
          return false;
        }
        
        // Filter by permissions
        if (route.permissions && userPermissions) {
          return route.permissions.some(permission => 
            userPermissions.includes(permission)
          );
        }
        
        return true;
      })
      .map(route => ({
        ...route,
        children: route.children ? filterRoutes(route.children) : undefined,
      }));
  };
  
  return filterRoutes(routes);
};

/**
 * Check if user can access route
 */
export const canAccessRoute = (route: RouteConfig, userPermissions?: string[]): boolean => {
  // Check if route requires authentication
  if (route.requiresAuth && !userPermissions) {
    return false;
  }
  
  // Check permissions
  if (route.permissions && userPermissions) {
    return route.permissions.some(permission => 
      userPermissions.includes(permission)
    );
  }
  
  return true;
};

/**
 * Get parent route
 */
export const getParentRoute = (path: string): RouteConfig | undefined => {
  const findParentRoute = (routes: RouteConfig[], targetPath: string): RouteConfig | undefined => {
    for (const route of routes) {
      if (route.children) {
        for (const child of route.children) {
          if (child.path === targetPath) {
            return route;
          }
        }
        const parentRoute = findParentRoute(route.children, targetPath);
        if (parentRoute) {
          return parentRoute;
        }
      }
    }
    return undefined;
  };
  
  return findParentRoute(routes, path);
};

/**
 * Get route hierarchy (parent to child)
 */
export const getRouteHierarchy = (path: string): RouteConfig[] => {
  const hierarchy: RouteConfig[] = [];
  
  const buildHierarchy = (routes: RouteConfig[], targetPath: string, currentHierarchy: RouteConfig[]): boolean => {
    for (const route of routes) {
      const newHierarchy = [...currentHierarchy, route];
      
      if (route.path === targetPath) {
        hierarchy.push(...newHierarchy);
        return true;
      }
      
      if (route.children && buildHierarchy(route.children, targetPath, newHierarchy)) {
        return true;
      }
    }
    return false;
  };
  
  buildHierarchy(routes, path, []);
  return hierarchy;
};

/**
 * Generate route path with parameters
 */
export const generateRoutePath = (route: string, params: Record<string, string | number> = {}): string => {
  let path = route;
  
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, String(value));
  });
  
  return path;
};

/**
 * Check if path matches route
 */
export const matchesRoute = (currentPath: string, routePath: string, exact = false): boolean => {
  if (exact) {
    return currentPath === routePath;
  }
  
  return currentPath.startsWith(routePath);
};

/**
 * Get active route from current path
 */
export const getActiveRoute = (currentPath: string): RouteConfig | undefined => {
  const allRoutes = getAllRoutes();
  
  // First try exact match
  let activeRoute = allRoutes.find(route => route.path === currentPath);
  
  // If no exact match, find best partial match
  if (!activeRoute) {
    const matches = allRoutes
      .filter(route => currentPath.startsWith(route.path) && route.path !== '/')
      .sort((a, b) => b.path.length - a.path.length); // Sort by path length (most specific first)
    
    activeRoute = matches[0];
  }
  
  return activeRoute;
};