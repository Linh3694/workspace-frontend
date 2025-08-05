import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

export default function MicrosoftCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Prevent processing the same callback multiple times
    if (processed) {
      console.log('DEBUG: Callback already processed, skipping');
      return;
    }

    // Check if we have already processed this callback in this session
    const callbackProcessed = sessionStorage.getItem('microsoft_callback_processed');
    if (callbackProcessed) {
      console.log('DEBUG: Callback already processed in this session, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    const handleCallback = async () => {
      try {
        // Check if callback was successful or had error
        const success = searchParams.get('success');
        const errorParam = searchParams.get('error');

        if (success === 'false' || errorParam) {
          const errorMessage = errorParam ? decodeURIComponent(errorParam) : 'Microsoft authentication failed';
          throw new Error(`Microsoft authentication error: ${errorMessage}`);
        }

        // Parse token and user data from URL fragment
        const hash = window.location.hash.substring(1); // Remove #
        console.log('DEBUG: Full URL:', window.location.href);
        console.log('DEBUG: Hash fragment:', hash);
        
        const hashParams = new URLSearchParams(hash);
        
        const token = hashParams.get('token');
        const userEncoded = hashParams.get('user');
        
        console.log('DEBUG: Token exists:', !!token);
        console.log('DEBUG: UserEncoded exists:', !!userEncoded);
        console.log('DEBUG: Token preview:', token ? token.substring(0, 20) + '...' : 'null');

        if (!token || !userEncoded) {
          console.error('DEBUG: Missing auth data - token:', !!token, 'user:', !!userEncoded);
          throw new Error('Missing authentication data in callback');
        }

        // Decode user data
        let userData;
        try {
          const userJson = atob(userEncoded);
          userData = JSON.parse(userJson);
          console.log('DEBUG: Decoded user data:', userData);
        } catch (decodeError) {
          console.error('DEBUG: Failed to decode user data:', decodeError);
          throw new Error('Failed to decode user authentication data');
        }
        
        // Convert to User format with proper role mapping
        const userRole = userData.user_role || 'user';
        console.log('DEBUG: User role from backend:', userRole);
        console.log('DEBUG: Frappe roles from backend:', userData.frappe_roles);
        
        const user = {
          _id: userData.email, // Use email as ID for now
          fullname: userData.full_name,
          email: userData.email,
          role: userRole as UserRole, // Use ERP custom role from backend
          avatarUrl: undefined, // Can be added later
          permissions: undefined, // Can be added later
          // Additional user info
          jobTitle: userData.job_title,
          department: userData.department,
          employeeCode: userData.employee_code,
          username: userData.username,
          provider: userData.provider,
          frappeRoles: userData.frappe_roles, // Frappe system roles
          microsoftId: userData.microsoft_id,
          active: userData.active,
          accountEnabled: userData.account_enabled
        };

        // Store the system token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update auth context
        login(user);

        // Clear URL fragment for security
        window.history.replaceState({}, document.title, window.location.pathname);

        // Mark as processed to prevent re-running
        setProcessed(true);
        sessionStorage.setItem('microsoft_callback_processed', 'true');

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Microsoft callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
        
        // Redirect to login with error after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { error: err instanceof Error ? err.message : 'Authentication failed' } });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login, processed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang xử lý đăng nhập Microsoft...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đăng nhập thất bại</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Bạn sẽ được chuyển về trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return null;
}