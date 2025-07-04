import React, { useState, useEffect } from 'react';
import { getOptimizedAvatarUrl, validateImageUrl, getDefaultAvatar } from './utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  name?: string;
  email?: string;
  className?: string;
  fallback?: string;
  onError?: () => void;
}

/**
 * Smart Avatar component that handles fallbacks automatically
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 40,
  name,
  email,
  className = '',
  fallback,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadAvatar = async () => {
      setHasError(false);
      console.log('🖼️ Avatar loadAvatar:', { src, name, email, size });
      
      if (src) {
        const avatarUrl = getOptimizedAvatarUrl(src, size, name, email);
        console.log('🖼️ Avatar optimized URL:', avatarUrl);
        const isValid = await validateImageUrl(avatarUrl);
        console.log('🖼️ Avatar validation result:', isValid);
        
        if (isValid) {
          setCurrentSrc(avatarUrl);
          return;
        }
      }
      
      // Use fallback or default
      const fallbackUrl = fallback || getDefaultAvatar(name, email);
      const finalFallbackUrl = fallbackUrl.replace(/size=\d+/, `size=${size}`);
      console.log('🖼️ Avatar using fallback:', finalFallbackUrl);
      setCurrentSrc(finalFallbackUrl);
    };

    loadAvatar();
  }, [src, size, name, email, fallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fallbackUrl = fallback || getDefaultAvatar(name, email);
      setCurrentSrc(fallbackUrl.replace(/size=\d+/, `size=${size}`));
      onError?.();
    }
  };

  return (
    <img
      src={currentSrc || undefined}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={handleError}
      loading="lazy"
    />
  );
};

/**
 * Hook to get avatar URL with automatic fallback
 */
export const useAvatar = (
  avatarUrl?: string | null,
  name?: string,
  email?: string,
  size: number = 200
) => {
  const [finalUrl, setFinalUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadAvatar = async () => {
      setIsLoading(true);
      setHasError(false);

      if (avatarUrl) {
        const url = getOptimizedAvatarUrl(avatarUrl, size, name, email);
        const isValid = await validateImageUrl(url);
        
        if (isValid) {
          setFinalUrl(url);
          setIsLoading(false);
          return;
        } else {
          setHasError(true);
        }
      }

      // Use default avatar
      const defaultUrl = getDefaultAvatar(name, email);
      setFinalUrl(defaultUrl.replace(/size=\d+/, `size=${size}`));
      setIsLoading(false);
    };

    loadAvatar();
  }, [avatarUrl, name, email, size]);

  return {
    url: finalUrl,
    isLoading,
    hasError
  };
};

/**
 * Avatar component specifically for user profiles
 */
interface UserAvatarProps {
  user: {
    avatarUrl?: string | null;
    fullname?: string;
    email?: string;
  };
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  className = '',
  showTooltip = false
}) => {
  console.log('🖼️ UserAvatar render:', { user: user.fullname, avatarUrl: user.avatarUrl });
  
  const avatarElement = (
    <Avatar
      src={user.avatarUrl ? getOptimizedAvatarUrl(user.avatarUrl, size, user.fullname, user.email) : undefined}
      name={user.fullname}
      email={user.email}
      alt={user.fullname || user.email || 'User'}
      size={size}
      className={className}
    />
  );

  if (showTooltip && (user.fullname || user.email)) {
    return (
      <div title={user.fullname || user.email}>
        {avatarElement}
      </div>
    );
  }

  return avatarElement;
};

/**
 * Avatar group component for displaying multiple avatars
 */
interface AvatarGroupProps {
  users: Array<{
    avatarUrl?: string | null;
    fullname?: string;
    email?: string;
  }>;
  max?: number;
  size?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 5,
  size = 32,
  className = ''
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {visibleUsers.map((user, index) => (
        <div
          key={index}
          className="relative -ml-2 first:ml-0 border-2 border-white rounded-full"
          style={{ zIndex: visibleUsers.length - index }}
        >
          <UserAvatar
            user={user}
            size={size}
            showTooltip
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="relative -ml-2 border-2 border-white rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600"
          style={{ 
            width: size, 
            height: size,
            zIndex: 0
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar; 