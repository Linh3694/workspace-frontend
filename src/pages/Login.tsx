import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../lib/config';
import { ArrowLeftIcon } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Animation effect for banner
  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    let animationId: number;
    let translateX = 0;
    const BANNER_WIDTH = 1100; // Width của 1 ảnh
    const ANIMATION_SPEED = 1; // pixels per frame

    const animate = () => {
      translateX -= ANIMATION_SPEED;
      // Reset khi đã di chuyển hết 1 ảnh để tạo hiệu ứng loop seamless
      if (translateX <= -BANNER_WIDTH) {
        translateX = 0;
      }
      banner.style.transform = `translateX(${translateX}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Lưu token vào localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role);

      // Chuyển hướng về trang dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Sử dụng Microsoft Authentication Library (MSAL)
      const { PublicClientApplication } = await import('@azure/msal-browser');
      
      const msalConfig = {
        auth: {
          clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '38b5b315-9e8e-4ca8-9b2e-3c0a3b7e9c29',
          authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common'}`,
          redirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: 'localStorage' as const,
          storeAuthStateInCookie: false,
        }
      };

      const pca = new PublicClientApplication(msalConfig);
      await pca.initialize();

      const loginRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account' as const
      };

      const response = await pca.loginPopup(loginRequest);
      
      if (response.accessToken) {
        // Gửi token đến backend để xác thực
        const backendResponse = await fetch(API_ENDPOINTS.MICROSOFT_LOGIN, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${response.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const backendData = await backendResponse.json();
        
        if (!backendResponse.ok) {
          throw new Error(backendData.message || 'Đăng nhập Microsoft thất bại');
        }

        if (backendData.success) {
          // Lưu thông tin đăng nhập
          localStorage.setItem('token', backendData.token);
          localStorage.setItem('user', JSON.stringify(backendData.user));
          localStorage.setItem('role', backendData.user.role);

          // Chuyển hướng về dashboard
          navigate('/dashboard');
        } else {
          throw new Error(backendData.message || 'Đăng nhập Microsoft thất bại');
        }
      }
    } catch (error) {
      console.error('Lỗi đăng nhập Microsoft:', error);
      
      // Xử lý lỗi cụ thể từ MSAL
      if (error && typeof error === 'object' && error !== null && 'errorCode' in error) {
        const msalError = error as { errorCode: string; errorMessage?: string; message?: string };
        if (msalError.errorCode === 'invalid_request' && msalError.errorMessage?.includes('Single-Page Application')) {
          setError('Lỗi cấu hình: Azure App Registration cần được cấu hình là "Single-Page Application". Vui lòng liên hệ admin.');
        } else if (msalError.errorCode === 'user_cancelled') {
          setError('Đăng nhập bị hủy bởi người dùng');
        } else {
          setError(`Lỗi Microsoft: ${msalError.errorMessage || msalError.message || 'Không xác định'}`);
        }
      } else {
        setError(error instanceof Error ? error.message : 'Đăng nhập Microsoft thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-h-screen bg-white">
      {/* Left side - Animated Banner */}
      <div className="w-[55%] flex items-center justify-center overflow-hidden bg-white">
        <div className="w-full h-[60%] overflow-hidden relative">
          <div
            ref={bannerRef}
            className="flex h-full"
            style={{ width: '3300px' }} // 3 times banner width for seamless loop
          >
            <img
              src="/welcome.png"
              alt="Welcome Banner 1"
              className="w-full h-full object-cover"
            />
            <img
              src="/welcome.png"
              alt="Welcome Banner 2"
              className="w-full h-full object-cover"
            />
            <img
              src="/welcome.png"
              alt="Welcome Banner 3"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Left gradient overlay */}
          <div className="absolute top-0 left-0 w-30 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
          
          {/* Right gradient overlay */}
          <div className="absolute top-0 right-0 w-30 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        </div>
      </div>

      {/* Right side - Login Content */}
      <div className="w-[45%] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-10">
          {/* Logo and Slogan */}
          {!showForm && (
            <div className="text-center space-y-0">
              <img
                src="/app-logo-full.svg"
                alt="WIS Logo"
                className="h-48 w-auto mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="space-y-2">
                <p className="text-xl text-[#000000] font-semibold">
                  Không cần mò mẫm, làm việc sáng suốt
                </p>
              </div>
            </div>
          )}

          {/* Login Options */}
          {!showForm ? (
            <div className="w-full mx-auto space-y-3">
              {/* Microsoft Login Button */}
              <button
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-full bg-[#F05023]/15  py-4 px-6 text-[#F05023] font-bold hover:bg-[#F05023]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Microsoft'}
              </button>

              {/* Account Login Button */}
              <button
                onClick={() => setShowForm(true)}
                className="w-full text-[#757575] font-semibold py-2 hover:text-gray-800 transition-colors"
              >
                Đăng nhập bằng tài khoản
              </button>
            </div>
          ) : (
            /* Login Form */
              <div className="w-full mx-auto bg-white rounded-3xl border border-gray-200 p-8 space-y-6">
                <div className="flex items-center justify-start gap-5">
                <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-[#002855] py-2 hover:text-gray-700 transition-colors font-medium text-left"
                  >
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 text-left">Đăng nhập</h2>
                  </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-base font-medium text-gray-800 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                      placeholder="example@wellspring.edu.vn"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-base font-medium text-gray-800 mb-2">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F05023] text-white py-3 px-4 rounded-full font-semibold text-base hover:bg-[#E04420] focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 transition-colors font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <div className="text-center space-y-6">
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <p className="px-4 text-[#757575] text-sm">Đăng nhập với phương thức khác</p>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-full bg-[#F05023]/10 py-3 px-6 text-[#F05023] font-semibold hover:bg-[#F05023]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Microsoft'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 