import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { MedSageLogo } from '../../components/MedSageLogo';
import { API_ENDPOINTS, apiCall } from '../../api';
import { useAppContext } from '../../App';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user: guestUser, setUser } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.trim(), 
          password,
          previousGuestId: guestUser?.id 
        }),
      });

      // Store tokens
      localStorage.setItem('token', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      // Remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Update React context immediately so Home page shows correct name
      const u = result.data.user;
      setUser({
        id: u._id || u.id,
        name: u.fullName || u.name || '',
        gender: u.gender || 'female',
        age: u.age || 28,
        goals: u.goals || []
      });
      
      console.log('Login successful:', result.data.user.email);
      navigate('/app');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message.includes('verify your email') || error.message.includes('email verified')) {
        const shouldResend = window.confirm(
          'You need to verify your email address before logging in. Would you like to resend the verification email?'
        );
        
        if (shouldResend && email) {
          try {
            await apiCall(API_ENDPOINTS.AUTH.SEND_VERIFICATION, {
              method: 'POST',
              body: JSON.stringify({ email }),
            });
            navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
          } catch (resendError) {
            console.error('Failed to resend verification:', resendError);
            alert('Failed to resend verification code. Please try again.');
          }
        } else if (email) {
          // If they didn't want to resend but still need to verify, just take them to the page
          navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        }
        return;
      }
      
      alert(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Redirect to backend Google OAuth endpoint with guest ID for migration
      const guestId = guestUser?.id || '';
      window.location.href = `${API_ENDPOINTS.AUTH.GOOGLE_AUTH}?previousGuestId=${guestId}`;
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Failed to initiate Google sign-in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* MedSage Background Gradient - Teal/Green Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-emerald-100 to-green-100" />
      
      {/* Floating Blobs - MedSage Colors */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-green-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Visual Identity */}
            <div className="relative hidden lg:block">
              {/* MedSage Logo Large */}
              <div className="flex justify-center mb-8">
                <MedSageLogo className="w-48 h-48" />
              </div>
              
              {/* Tagline */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-teal-900 mb-4">
                  Understand Your Body.
                  <br />
                  Transform Your Life.
                </h2>
                <p className="text-teal-700 text-lg">
                  Your personalized health journey starts here
                </p>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {/* MedSage Glassmorphic Card */}
                <div className="backdrop-blur-xl bg-white/30 border border-teal-200/30 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
                  {/* Inner Glow Border - MedSage Colors */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-400/20 via-emerald-400/20 to-green-400/20" />
                  <div className="absolute inset-[2px] rounded-3xl bg-white/90 backdrop-blur-xl" />
                  
                  <div className="relative z-10">
                    {/* MedSage Logo */}
                    <div className="flex justify-center mb-8">
                      <MedSageLogo className="w-16 h-16" />
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-2xl font-bold text-teal-900 text-center mb-2">
                      Welcome Back
                    </h1>
                    <p className="text-teal-700 text-center mb-8">
                      Sign in to continue your health journey
                    </p>
                    
                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-teal-800 mb-2">
                          Email or Phone
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-500" />
                          <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/70 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="Enter your email or phone"
                          />
                        </div>
                      </div>
                      
                      {/* Password Field */}
                      <div>
                        <label className="block text-sm font-medium text-teal-800 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-3 bg-white/70 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-500 hover:text-teal-700 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Options */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-teal-600 bg-white/70 border-teal-300 rounded focus:ring-teal-500"
                          />
                          <span className="ml-2 text-sm text-teal-800">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-teal-600 hover:text-teal-800 transition-colors">
                          Forgot password?
                        </a>
                      </div>
                      
                      {/* Primary CTA */}
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        <span>Login</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      {/* Secondary CTA */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full py-3 bg-white/70 border border-teal-200 text-teal-800 font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    </form>
                    
                    {/* Footer */}
                    <div className="text-center mt-8 pt-6 border-t border-teal-200/50 space-y-3">
                      <p className="text-teal-700">
                        Don't have an account?{' '}
                        <button 
                          onClick={() => navigate('/signup')}
                          className="text-teal-600 hover:text-teal-800 font-semibold transition-colors"
                        >
                          Sign Up
                        </button>
                      </p>
                      
                      <div className="flex items-center justify-center gap-2 text-xs text-teal-600">
                        <span>Didn't receive a code?</span>
                        <button 
                          type="button"
                          disabled={!email || isResending}
                          onClick={async () => {
                            if (!email) {
                              alert('Please enter your email first.');
                              return;
                            }
                            try {
                              setIsResending(true);
                              await apiCall(API_ENDPOINTS.AUTH.SEND_VERIFICATION, {
                                method: 'POST',
                                body: JSON.stringify({ email: email.trim() }),
                              });
                              alert('Verification code sent! Please check your inbox.');
                              navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
                            } catch (err: any) {
                              alert(err.message || 'Failed to send code.');
                            } finally {
                              setIsResending(false);
                            }
                          }}
                          className="font-bold hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                        >
                          {isResending ? 'Sending...' : 'Resend Verification'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
