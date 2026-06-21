import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Home } from './pages/Home';
import { Chat } from './pages/Chat';
import { Nutrition } from './pages/Nutrition';
import { MentalHealth } from './pages/MentalHealth';
import { Workout } from './pages/Workout';
import { Hormones } from './pages/Hormones';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { AppProvider, useAppContext } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import SimpleSignUpPage from './pages/auth/SimpleSignUpPage';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';
import AuthSuccess from './pages/auth/AuthSuccess';

// Re-export useAppContext for convenience
export { useAppContext };

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SimpleSignUpPage />} />
          <Route path="/signup-advanced" element={
            <ErrorBoundary>
              <SignUpPage />
            </ErrorBoundary>
          } />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="chat" element={<Chat />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="mental-health" element={<MentalHealth />} />
            <Route path="workout" element={<Workout />} />
            <Route path="hormones" element={<Hormones />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
