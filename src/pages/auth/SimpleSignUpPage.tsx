import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import { MedSageLogo } from '../../components/MedSageLogo';
import { API_ENDPOINTS, apiCall } from '../../api';

const SimpleSignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Starting signup process...');
      
      const result = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim()
        }),
      });

      console.log('✅ Signup successful:', result);
      console.log('👤 User created:', result.data.user.email);

      // Send OTP for email verification
      try {
        await apiCall(API_ENDPOINTS.AUTH.SEND_VERIFICATION, {
          method: 'POST',
          body: JSON.stringify({ email: formData.email }),
        });
        
        // Redirect to OTP verification page
        navigate('/verify-otp?email=' + encodeURIComponent(result.data.user.email));
      } catch (otpError) {
        console.error('Failed to send OTP:', otpError);
        // Still redirect to OTP page, user can resend
        navigate('/verify-otp?email=' + encodeURIComponent(result.data.user.email));
      }
    } catch (error: any) {
      console.error('❌ Signup error details:', {
        error: error,
        message: error.message,
        stack: error.stack,
        type: typeof error
      });
      
      // Provide more specific error messages
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.details && Array.isArray(error.details)) {
        errorMessage = `Validation failed: ${error.details.map((d: any) => d.message).join(', ')}`;
      } else if (error.message.includes('Email already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and number.';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
          <div className="backdrop-blur-xl bg-white/30 border border-teal-200/30 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-400/20 via-emerald-400/20 to-green-400/20" />
            <div className="absolute inset-[2px] rounded-3xl bg-white/90 backdrop-blur-xl" />
            
            <div className="relative z-10">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <MedSageLogo className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-teal-900 text-center mb-2">
                Create Account
              </h1>
              <p className="text-teal-700 text-center mb-6">
                Start your health journey with MedSage
              </p>
              
              {/* Signup Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-3 bg-white/70 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white/70 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 bg-white/70 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Create a password (min 6 characters)"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 bg-white/70 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                {/* Sign Up Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
              
              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-teal-700 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSignUpPage;
