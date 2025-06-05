import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Avatar utilities
export const AVATAR_BASE_URL = "https://api-dev.wellspring.edu.vn/uploads/Avatar";

/**
 * Get full avatar URL from avatar filename
 * @param avatarUrl - The avatar filename (e.g. "user123.jpg")
 * @returns Full avatar URL or fallback
 */
export function getAvatarUrl(avatarUrl?: string | null): string {
  if (!avatarUrl) {
    return getDefaultAvatar();
  }
  
  // If already a full URL, return as is
  if (avatarUrl.startsWith('http') || avatarUrl.startsWith('//')) {
    return avatarUrl;
  }
  
  return `${AVATAR_BASE_URL}/${avatarUrl}`;
}

/**
 * Get default avatar based on user info
 * @param name - User's full name (optional)
 * @param email - User's email (optional)
 * @returns Default avatar URL
 */
export function getDefaultAvatar(name?: string, email?: string): string {
  // Use initials-based avatar service
  if (name) {
    const initials = getInitials(name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=002147&color=ffffff&size=200&format=png`;
  }
  
  if (email) {
    // Use first letter of email
    const initial = email.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=002147&color=ffffff&size=200&format=png`;
  }
  
  // Generic default avatar
  return `https://ui-avatars.com/api/?name=User&background=002147&color=ffffff&size=200&format=png`;
}

/**
 * Get initials from a full name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return 'U';
  
  const parts = name.trim().split(' ').filter(part => part.length > 0);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Take first character of first and last name
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Validate if URL is a valid image
 * @param url - Image URL to validate
 * @returns Promise<boolean>
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Get optimized avatar URL with size
 * @param avatarUrl - Avatar filename
 * @param size - Size in pixels (default: 200)
 * @param name - Fallback name for default avatar
 * @param email - Fallback email for default avatar
 * @returns Optimized avatar URL
 */
export function getOptimizedAvatarUrl(
  avatarUrl?: string | null, 
  size: number = 200,
  name?: string,
  email?: string
): string {
  // If no avatar provided, use default with name/email
  if (!avatarUrl) {
    const defaultUrl = getDefaultAvatar(name, email);
    return defaultUrl.replace(/size=\d+/, `size=${size}`);
  }
  
  const fullUrl = getAvatarUrl(avatarUrl);
  
  // If it's our default avatar service, update size
  if (fullUrl.includes('ui-avatars.com')) {
    return fullUrl.replace(/size=\d+/, `size=${size}`);
  }
  
  // If it's a custom uploaded avatar, return as is
  // (You could add image resizing service here if needed)
  return fullUrl;
}
