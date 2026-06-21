import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { MedSageLogo } from '../../components/MedSageLogo';
import { API_ENDPOINTS, apiCall } from '../../api';
import { useAppContext } from '../../App';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAppContext();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!emailFromUrl) {
      navigate('/signup');
      return;
    }
    
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emailFromUrl, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiCall(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      // Store tokens
      localStorage.setItem('token', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      // Update React context
      const u = result.data.user;
      setUser({
        id: u._id || u.id,
        name: u.fullName || u.name || '',
        gender: u.gender || 'female',
        age: u.age || 28,
        goals: u.goals || []
      });

      // Redirect to profile setup instead of directly to app
      navigate('/profile-setup');
    } catch (error: any) {
      alert(error.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await apiCall(API_ENDPOINTS.AUTH.SEND_VERIFICATION, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      alert('New OTP sent to your email!');
      setResendTimer(60);
      setCanResend(false);
      
      // Restart countdown
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-teal-100 via-emerald-100 to-green-100">
      {/* Floating Blobs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Glassmorphic Card */}
          <div className="backdrop-blur-xl bg-white/30 border border-teal-200/30 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-400/20 via-emerald-400/20 to-green-400/20" />
            <div className="absolute inset-[2px] rounded-3xl bg-white/90 backdrop-blur-xl" />
            
            <div className="relative z-10">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-teal-900 text-center mb-2">
                Verify Your Email
              </h1>
              <p className="text-teal-700 text-center mb-6">
                Enter the 6-digit code sent to<br/>
                <span className="font-semibold">{email}</span>
              </p>
              
              {/* OTP Form */}
              <form onSubmit={handleVerify} className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Verification Code
                  </label>
                  <div className="flex gap-2 justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 bg-white/70 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>
                
                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Verify Email</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
              
              {/* Resend OTP */}
              <div className="mt-6 text-center">
                <p className="text-teal-700 text-sm">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || isLoading}
                    className={`font-semibold transition-colors ${
                      canResend 
                        ? 'text-teal-600 hover:text-teal-800' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                  </button>
                </p>
              </div>
              
              {/* Back to Signup */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-sm text-teal-600 hover:text-teal-800 transition-colors"
                >
                  Back to Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
