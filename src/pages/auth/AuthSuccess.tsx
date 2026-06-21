import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MedSageLogo } from '../../components/MedSageLogo';
import { useAppContext } from '../../App';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAppContext();

  useEffect(() => {
    // Extract tokens and user data from URL parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const userStr = params.get('user');

    if (token && refreshToken && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Save to localStorage just like standard login
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update React context immediately
        setUser({
          id: user._id || user.id,
          name: user.fullName || user.name || '',
          gender: user.gender || 'female',
          age: user.age || 28,
          goals: user.goals || []
        });
        
        console.log('OAuth login successful:', user.email);
        
        // Brief delay for visual feedback before redirecting
        setTimeout(() => {
          navigate('/app');
        }, 1500);
      } catch (error) {
        console.error('Failed to parse user data from OAuth callback:', error);
        navigate('/login?error=auth_failed');
      }
    } else {
      navigate('/login?error=missing_tokens');
    }
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-emerald-100 to-green-100" />
      
      {/* Floating Blobs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 flex flex-col items-center">
        <MedSageLogo className="w-24 h-24 mb-6 animate-bounce" />
        <h2 className="text-3xl font-bold text-teal-900 mb-2">Signing you in...</h2>
        <p className="text-teal-700">Please wait while we set up your session.</p>
        
        {/* Loading Spinner */}
        <div className="mt-8 flex space-x-2">
          <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
